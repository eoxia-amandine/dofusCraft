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

const List = () => {
    const { id } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [totalPrices, setTotalPrices] = useState({});
    const [globalPrice, setGlobalPrice] = useState(0);
    const priceInputsRef = useRef({});

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
    }, [id]);

    // Calcul des prix en direct
    useEffect(() => {
      const newTotalPrices = {};
      items.forEach((item) => {
          if (item.recipeDetails) {
              item.recipeDetails.forEach((ingredient) => {
                  const quantity = quantities[ingredient.item_ankama_id] ?? ingredient.quantity;
                  const price = ingredient.unitPrice ?? 0;
                  newTotalPrices[ingredient.item_ankama_id] = (price * quantity).toFixed(0);
              });
          }
      });
      setTotalPrices(newTotalPrices);
    }, [items, quantities]);

    // Met à jour le prix global de l'item
    useEffect(() => {
      let total = 0;
      Object.values(totalPrices).forEach((price) => {
          total += parseInt(price, 10) || 0;
      });
      setGlobalPrice(total);
    }, [totalPrices]);

    // 🔹 Fonction pour enregistrer un prix en base lors de l'appui sur "Entrée"
    const handlePriceKeyPress = async (event, ingredient, index) => {
      if (event.key === "Enter") {
          const newPrice = parseFloat(event.target.value);
  
          if (!isNaN(newPrice) && newPrice >= 0) {
              const result = await window.api.addItemPrice({
                  ankamaId: ingredient.ankama_id,
                  value: newPrice
              });
  
              if (result.success) {
                  console.log(`✅ Prix enregistré : ${newPrice} K`);
                  const nextIndex = index + 1;
                  if (priceInputsRef.current[nextIndex]) {
                      priceInputsRef.current[nextIndex].focus();
                      priceInputsRef.current[nextIndex].select();
                  }
              } else {
                  console.error("❌ Erreur lors de l'enregistrement du prix :", result.error);
              }
          }
      }
    };

    const handleQuantityChange = (event, ingredientId, maxQuantity) => {
      let newQuantity = parseInt(event.target.value, 10) || 0;
  
      if (newQuantity > maxQuantity) {
          newQuantity = maxQuantity;
      } else if (newQuantity < 0) {
          newQuantity = 0;
      }
  
      setQuantities((prev) => ({ ...prev, [ingredientId]: newQuantity }));
    };
    
    const handlePriceChange = (event, ingredientId) => {
      const newPrice = event.target.value === "" ? "" : parseFloat(event.target.value);
      setItems((prevItems) =>
          prevItems.map((item) => ({
              ...item,
              recipeDetails: item.recipeDetails.map((ingredient) =>
                  ingredient.item_ankama_id === ingredientId
                      ? { ...ingredient, unitPrice: newPrice }
                      : ingredient
              ),
          }))
      );
    };

    return (
        <div>
            {loading ? (
                <p>Chargement des items...</p>
            ) : items.length > 0 ? (
                <div className="list-items">
                    {items.map((item) => (
                        <div key={item.id} className="item">
                            <span className="item__delete">
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
                                        <div key={ingredient.item_ankama_id} className="item__recipe">
                                            <div className="item__recipe-content">
                                                <img src={ingredient.image_urls.icon} className="item__recipe-thumb" alt="icon" />
                                                <div className="item__recipe-name" title={ingredient.name}>{ingredient.name}</div>
                                                <div className="item__recipe-quantity">
                                                    (<input
                                                        type="number"
                                                        min="0"
                                                        max={ingredient.quantity}
                                                        value={quantities[ingredient.item_ankama_id] ?? ingredient.quantity}
                                                        onChange={(e) => handleQuantityChange(e, ingredient.item_ankama_id)}
                                                    /> / {ingredient.quantity})
                                                </div>
                                            </div>
                                            <div className="item__recipe-price">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    ref={(el) => (priceInputsRef.current[index] = el)} 
                                                    value={String(ingredient.unitPrice ?? "")}
                                                    onChange={(e) => handlePriceChange(e, ingredient.item_ankama_id)}
                                                    onKeyDown={(e) => handlePriceKeyPress(e, ingredient, index)}
                                                />
                                                / <span className="item__recipe-price-total">
                                                  {totalPrices[ingredient.item_ankama_id] || 0} K
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="item__footer">
                                <span>Prix total du craft</span>
                                <span className="item__total-price">{globalPrice} k</span>
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
