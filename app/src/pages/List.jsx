import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const List = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchRecipeDetails = async (recipeArray) => {
    if (!Array.isArray(recipeArray) || recipeArray.length === 0) return [];

    const detailedRecipes = await Promise.all(
        recipeArray.map(async (ingredient) => {
            const ingredientDetails = await window.api.fetchDofusData(
              `fr/items/${ingredient.item_subtype}/${ingredient.item_ankama_id}`
            );

            return ingredientDetails
                ? { ...ingredient, ...ingredientDetails }
                : ingredient;
        })
    );

    return detailedRecipes;
  };


  const fetchItemDetails = async (ankamaId, type) => {
    try {
      const response = await window.api.fetchDofusData(`fr/items/${type}/${ankamaId}`);
      console.log(response);

      let detailedRecipe = [];
      if (Array.isArray(response.recipe) && response.recipe.length > 0) {
          detailedRecipe = await fetchRecipeDetails(response.recipe);
      }


      return { ...response, recipeDetails: detailedRecipe };;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'item :", error);
      return null;
    }
  };

  // @TODO :
  // Il faut pouvoir enregistrer les prix dans la DB.
  // Lorsqu'il existe il faut le récupérer, et à l'édition il faut remplacer grâce à l'ID.

  // Il faut pouvoir mettre à jour la quantité pour avoir un prix calculé

  const handlePriceChange = async (ingredient, newPrice) => {
    if (!ingredient.ankama_id) return;

    const result = await window.api.addItemPrice({
      ankamaId: ingredient.ankama_id,
      value: parseFloat(newPrice)
    });

    console.log(result);

    if (result.success) {
        console.log("Prix mis à jour :", newPrice);
    } else {
        console.error("Erreur lors de la mise à jour du prix :", result.error);
    }
  };

  const handleInputChange = (itemIndex, ingredientIndex, field, value) => {
    setItems((prevItems) => {
        const updatedItems = [...prevItems];
        const updatedRecipe = [...updatedItems[itemIndex].recipeDetails];

        updatedRecipe[ingredientIndex] = {
            ...updatedRecipe[ingredientIndex],
            [field]: value
        };

        updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            recipeDetails: updatedRecipe
        };

        return updatedItems;
    });
  };

  const handlePriceKeyPress = async (event, ingredient) => {
    if (event.key === "Enter" && ingredient.unitPrice > 0) {
        const result = await window.api.addItemPrice({
            ankamaId: ingredient.ankama_id,
            value: parseFloat(ingredient.unitPrice)
        });

        console.log(result);
        if (result) {
            // handleInputChange(ingredient.itemIndex, ingredient.index, "unitPrice", "");
        }
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchItems = async () => {
      setLoading(true);
      const listItems = await window.api.getListItems(id);
      
      if (!Array.isArray(listItems) || listItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const detailedItems = await Promise.all(
        listItems.map(async (item) => {
          const details = await fetchItemDetails(item.ankamaId, item.type);
          return details ? { ...item, ...details } : item;
        })
      );

      setItems(detailedItems);
      setLoading(false);
    };

    fetchItems();
  }, [id]);

  return (
    <div>
      {loading ? (
        <p>Chargement des items...</p>
      ) : items.length > 0 ? (
        <div className="list-items">
          {items.map((item, itemIndex) => (
            <div key={item.id} className="item">
              <span className="item__delete">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
              </span>
              
              <div className="item__header">
                <img src={item.image_urls.icon} className="item__header-thumb" />
                <div className="item__header-content">
                  <h2 className="item__header-title">{item.name}</h2>
                  <ul className="item__header-attributes">
                    <li>Level {item.level}</li>
                  </ul>
                </div>
              </div>

              {item.recipeDetails && item.recipeDetails.length > 0 && (
                <div className="item__list-recipe">
                  {item.recipeDetails.map((ingredient, ingredientIndex) => (
                    <div key={ingredient.item_ankama_id} className="item__recipe">
                        <div className="item__recipe-content">
                          <img src={ingredient.image_urls.icon} className="item__recipe-thumb" />
                          <div className="item__recipe-name" title={ingredient.name}>{ingredient.name}</div>
                          <div className="item__recipe-quantity">
                            (
                            <input
                                type="number"
                                min="0"
                                value={ingredient.quantity}
                            />
                            / {ingredient.quantity} )
                          </div>
                        </div>
                        <div className="item__recipe-price">
                          <input
                              type="number"
                              min="0"
                              value={ingredient.unitPrice || ""}
                              onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  handleInputChange(itemIndex, ingredientIndex, "unitPrice", newPrice);
                              }}
                              onKeyDown={(e) => handlePriceKeyPress(e, ingredient)}
                          />
                          / <span className="item__recipe-price-total">{(ingredient.unitPrice || 0) * ingredient.quantity} K</span>
                        </div>
                    </div>
                  ))}
              </div>
              )}

              <div className="item__footer">
                <span>Prix total du craft</span>
                <span className="item__total-price">150 k</span>
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
