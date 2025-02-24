import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import appLogo from './../assets/logo.png';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState(""); // Texte entré par l'utilisateur
    const [searchResults, setSearchResults] = useState([]); // Résultats API
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const location = useLocation();
    const match = location.pathname.match(/^\/list\/(\d+)$/);
    const listId = match ? match[1] : null;
    const navigate = useNavigate();

    const fetchResults = async (query) => {
      if (!query.trim()) {
          setSearchResults([]); // Pas de recherche si champ vide
          return;
      }
  
      setLoading(true);
      try {
        // const response = await window.api.fetchDofusData(`fr/items/equipment/search?query=${query}`);
        const [equipmentRes, consumablesRes] = await Promise.all([
            window.api.fetchDofusData(`fr/items/equipment/search?query=${query}`),
            window.api.fetchDofusData(`fr/items/consumables/search?query=${query}`)
        ]);


        // const equipmentData = await equipmentRes.json();
        // const consumablesData = await consumablesRes.json();

        const equipmentItems = (Array.isArray(equipmentRes) ? equipmentRes : []).map(item => ({
            ...item,
            type: "equipment"
        }));

        const consumablesItems = (Array.isArray(consumablesRes) ? consumablesRes : []).map(item => ({
            ...item,
            type: "consumables"
        }));

        const combinedResults = [...equipmentItems, ...consumablesItems];

        setSearchResults(combinedResults);
      } catch (error) {
          console.error("Erreur API :", error);
          setSearchResults([]); // Réinitialise la liste en cas d'erreur
      }
      setLoading(false);
  };

    const debouncedFetch = useCallback(debounce(fetchResults, 500), []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        debouncedFetch(value); // Lance la recherche avec un délai
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setTimeout(() => setIsFocused(false), 200);

    const handleResultClick = async (item) => {

        let selectedListId = listId;

        if (!selectedListId) {
            const lists = await window.api.getLists();
            if (lists.length > 0) {
                selectedListId = lists[0].id;
            }
            console.log(`Aucun listId trouvé, utilisation de la première liste : ${selectedListId}`);
    
            // 🔹 Redirige vers la page de cette liste
            navigate(`/list/${selectedListId}`);
        }

        const success = await window.api.addListItem({
            listId: parseInt(selectedListId, 10),
            ankamaId: item.ankama_id,
            type: item.type,
        });

        if (success) {
            console.log("Élément ajouté avec succès !");
        } else {
            console.error("Erreur lors de l'ajout de l'élément.");
        }

        setSearchQuery("");
        setSearchResults([]);
    };
    
    return (
        <nav className="main-navigation">
            <div className="main-navigation__inner">
                <div className="logo">
                    <Link to="/" >
                        <img src={appLogo} alt="DofusCraft" />
                    </Link>
                </div>

                <div className="searchbar">
                  <label className="searchbar__inner">
                    <svg className="searchbar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                    
                    <input
                        type="text"
                        placeholder="Rechercher un équipement, un consommable..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="searchbar__input"
                    />

                  </label>
                  {isFocused && searchQuery && (
                        <div className="searchbar__results">
                            {loading ? (
                                <p className="searchbar__loading">Chargement...</p>
                            ) : (
                                searchResults.length > 0 ? (
                                    searchResults.map((item) => (
                                        <div
                                          key={item.ankama_id}
                                          type={item.type}
                                          className="searchbar__result"
                                          onClick={() => handleResultClick(item)}
                                        >
                                          <img src={item.image_urls.icon} className="searchbar__result-thumb" />
                                          <div className="searchbar__result-details">
                                            <div className="searchbar__result-name">{item.name}</div>
                                            <div className="searchbar__result-info">
                                              <span>#{item.ankama_id}</span>
                                            </div>
                                          </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="searchbar__no-results">Aucun résultat trouvé.</p>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="links"></div>
            </div>
        </nav>
    );
};

export default Navbar;
