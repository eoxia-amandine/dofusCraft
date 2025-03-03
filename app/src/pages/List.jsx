import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

// @TODO :
// Erreur :
// - Bug car le script prévoie mal plusieurs items : Le global price est commun
// - Le focus sur l'élément d'après change d'item et prends le dernier
// - Si je modifie une quantité, ça va la modifier sur tous les items de toutes les listes X_X
// Ajout :
// - Mettre à jour la page lors de l'ajout d'un item
// - Supprimer un élément
// - Gérer a ligne de prix non sauvegardée

const List = ({ refreshList, refreshTrigger }) => {
    const { id } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [totalPrices, setTotalPrices] = useState({});
    const [globalPrices, setGlobalPrices] = useState({});
    const priceInputsRef = useRef({});
    const [unsavedChanges, setUnsavedChanges] = useState({});

    // 🔹 Fonction pour récupérer les détails d'une recette
    const fetchRecipeDetails = async (recipeArray) => {
        if (!Array.isArray(recipeArray) || recipeArray.length === 0) return [];

        return await Promise.all(
            recipeArray.map(async (ingredient) => {
                const ingredientDetails = await window.api.fetchDofusData(
                    `fr/items/${ingredient.item_subtype}/${ingredient.item_ankama_id}`
                );

                return ingredientDetails ? { ...ingredient, ...ingredientDetails } : ingredient;
            })
        );
    };

    // 🔹 Fonction pour récupérer les détails d'un item et ses ingrédients
    const fetchItemDetails = async (ankamaId, type) => {
        try {
            const response = await window.api.fetchDofusData(`fr/items/${type}/${ankamaId}`);

            const detailedRecipe = response.recipe && response.recipe.length > 0
                ? await fetchRecipeDetails(response.recipe)
                : [];

            return { ...response, recipeDetails: detailedRecipe };
        } catch (error) {
            console.error("Erreur lors de la récupération des détails de l'item :", error);
            return null;
        }
    };

    // 🔹 Fonction pour récupérer le dernier prix en base
    const loadLastItemPrice = async (ankamaId) => {
        const price = await window.api.getItemPrice(ankamaId);
        return price !== undefined && price !== null ? price : 0;
    };

    // 🔹 Fonction principale qui charge tous les items et leurs recettes avec les prix
    const fetchItemsWithPrices = async () => {
      setLoading(true);
      const listItems = await window.api.getListItems(id);
  
      const detailedItems = await Promise.all(
          listItems.map(async (item) => {
              const details = await fetchItemDetails(item.ankamaId, item.type);
              if (!details) return item;
  
              const updatedItem = { ...item, ...details };

              if (updatedItem.recipeDetails) {
                updatedItem.recipeDetails = await Promise.all(
                    updatedItem.recipeDetails.map(async (ingredient) => {
                        const unitPrice = await loadLastItemPrice(ingredient.ankama_id);
                        return {
                            ...ingredient,
                            unitPrice: unitPrice ?? 0,
                        };
                    })
                );
              }
  
              return updatedItem;
          })
      );
  
      setItems(detailedItems);
      setLoading(false);
    };  

    // 🔹 Charge les items au montage du composant
    useEffect(() => {
        if (!id) return;
        fetchItemsWithPrices();
    }, [id, refreshTrigger]);

    // Calcul des prix en direct
    useEffect(() => {
      const newTotalPrices = {};
      items.forEach((item) => {
          if (item.recipeDetails) {
              item.recipeDetails.forEach((ingredient) => {
                  const quantity = quantities[`${item.id}_${ingredient.item_ankama_id}`] ?? ingredient.quantity;
                  const price = ingredient.unitPrice ?? 0;
                  newTotalPrices[`${item.id}_${ingredient.item_ankama_id}`] = (price * quantity).toFixed(0);
              });
          }
      });
      setTotalPrices(newTotalPrices);
    }, [items, quantities]);
    
    // Reset les unsaved au chargement d'une liste
    useEffect(() => {
        setUnsavedChanges({});
    }, [id]);  

    // Met à jour le prix global de l'item
    useEffect(() => {
        const newGlobalPrices = {};
        items.forEach((item) => {
            let total = 0;
            if (item.recipeDetails) {
                item.recipeDetails.forEach((ingredient) => {
                    const ingredientTotal = totalPrices[`${item.id}_${ingredient.item_ankama_id}`] ?? 0;
                    total += parseInt(ingredientTotal, 10);
                });
            }
            newGlobalPrices[item.id] = total.toFixed(0);
        });
        setGlobalPrices(newGlobalPrices);
    }, [totalPrices]);

    // 🔹 Fonction pour enregistrer un prix en base lors de l'appui sur "Entrée"
    const handlePriceKeyPress = async (event, ingredient, index, itemId) => {
      if (event.key === "Enter") {
        const inputRef = priceInputsRef.current[itemId]?.[index];
        if (inputRef) {
            await savePrice(inputRef, ingredient, index, itemId);
        }
      }
    };

    const savePrice = async (price, ingredient, index, itemId) => {
        const newPrice = parseFloat(price?.value) || 0;
    
        if (!isNaN(newPrice) && newPrice >= 0) {
            const result = await window.api.addItemPrice({
                ankamaId: ingredient.ankama_id,
                value: newPrice
            });
    
            if (result.success) {
                console.log(`✅ Prix enregistré : ${newPrice} K`);
    
                const nextIndex = index + 1;
                if (priceInputsRef.current[itemId] && priceInputsRef.current[itemId][nextIndex]) {
                  priceInputsRef.current[itemId][nextIndex].focus();
                  priceInputsRef.current[itemId][nextIndex].select();
                }
                setUnsavedChanges((prev) => ({
                    ...prev,
                    [`${itemId}_${ingredient.item_ankama_id}`]: false
                }));
            } else {
                console.error("❌ Erreur lors de la sauvegarde :", result.error);
            }
        }
    };     

    // Gère la modification du champ quantité
    const handleQuantityChange = (event, itemId, ingredientId, maxQuantity) => {
      let newQuantity = parseInt(event.target.value, 10) || 0;
  
      if (newQuantity > maxQuantity) {
          newQuantity = maxQuantity;
      } else if (newQuantity < 0) {
          newQuantity = 0;
      }
  
      setQuantities((prev) => ({ ...prev, [`${itemId}_${ingredientId}`]: newQuantity }));
    };
    
    // Gère la modification du champ prix
    const handlePriceChange = (event, itemId, ingredientId) => {
      const newPrice = parseFloat(event.target.value) || 0;

      setUnsavedChanges((prev) => ({
        ...prev,
        [`${itemId}_${ingredientId}`]: true
      }));

      setItems((prevItems) => {
        const updatedItems = prevItems.map((item) => {
            if (item.id === itemId) {
                return {
                    ...item,
                    recipeDetails: item.recipeDetails.map((ingredient) =>
                        ingredient.item_ankama_id === ingredientId
                            ? { ...ingredient, unitPrice: newPrice }
                            : ingredient
                    )
                };
            }
            return item;
        });

        return updatedItems;
      });
    };

    // Supprime l'item de la liste
    const handleDeleteItem = async (itemId, itemLabel) => {
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer l'item "${itemLabel}" de la liste ?`);
        if (!confirmDelete) return;
    
        const result = await window.api.deleteListItem(itemId);
    
        if (result) {
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        }
    };
    

    return (
        <div>
            {loading ? (
                <p>Chargement des items...</p>
            ) : items.length > 0 ? (
                <div className="list-items">
                    {items.map((item) => (
                        <div key={item.id} className="item">
                            <span className="item__delete" onClick={() => handleDeleteItem(item.id, item.name)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                    <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                </svg>
                            </span>

                            <div className="item__header">
                                <img src={item.image_urls.icon} className="item__header-thumb" alt="icon" />
                                <div className="item__header-content">
                                    <h2 className="item__header-title">{item.name}</h2>
                                    <ul className="item__header-attributes">
                                        <li>Level {item.level}</li>
                                    </ul>
                                </div>
                            </div>

                            {item.recipeDetails && item.recipeDetails.length > 0 && (
                                <div className="item__list-recipe">
                                    {item.recipeDetails.map((ingredient, index) => (
                                        <div key={ingredient.item_ankama_id} className={`item__recipe ${unsavedChanges[`${item.id}_${ingredient.item_ankama_id}`] ? "unsaved" : ""}`}>
                                            <div className="item__recipe-content">
                                                <img src={ingredient.image_urls.icon} className="item__recipe-thumb" alt="icon" />
                                                <div className="item__recipe-name" title={ingredient.name}>{ingredient.name}</div>
                                                <div className="item__recipe-quantity">
                                                    (<input
                                                        type="number"
                                                        min="0"
                                                        max={ingredient.quantity}
                                                        value={quantities[`${item.id}_${ingredient.item_ankama_id}`] ?? ingredient.quantity}
                                                        onChange={(e) => handleQuantityChange(e, item.id, ingredient.item_ankama_id, ingredient.quantity)}
                                                    /> / {ingredient.quantity})
                                                </div>
                                            </div>
                                            <div className="item__recipe-price">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    ref={(el) => {
                                                        if (!priceInputsRef.current[item.id]) {
                                                            priceInputsRef.current[item.id] = {};
                                                        }
                                                        priceInputsRef.current[item.id][index] = el;
                                                    }}
                                                    value={String(ingredient.unitPrice ?? "")}
                                                    onChange={(e) => handlePriceChange(e, item.id, ingredient.item_ankama_id)}
                                                    onKeyDown={(e) => handlePriceKeyPress(e, ingredient, index, item.id)}
                                                />
                                                / <span className="item__recipe-price-total">
                                                  {totalPrices[`${item.id}_${ingredient.item_ankama_id}`] || 0} K
                                                </span>
                                            </div>
                                            <button className="item__recipe-price-save" onClick={() => {
                                                const inputRef = priceInputsRef.current[item.id]?.[index];
                                                if (inputRef) {
                                                    savePrice(inputRef, ingredient, index, item.id);
                                                }
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="item__footer">
                                <span>Prix total du craft</span>
                                <span className="item__total-price">{globalPrices[item.id] || 0} K</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>Aucun item trouvé pour cette liste. Utiliser la barre de recherche pour en ajouter</p>
            )}
        </div>
    );
};

export default List;
