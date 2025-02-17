import { React, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [lists, setLists] = useState([]);
    const [newListLabel, setNewListLabel] = useState("");
    const location = useLocation();

    useEffect(() => {
        window.api.getLists().then((data) => {
            if (!data.error) {
                setLists(data);
            } else {
                console.error("Erreur BDD :", data.error);
            }
        });
    }, []);

    const handleAddList = async () => {
        if (!newListLabel.trim()) return; // Empêche d'ajouter une liste vide

        try {
            const newListId = await window.api.addList(newListLabel);
    
            console.log(newListId);
            if (newListId) {
                setLists([...lists, { id: newListId, label: newListLabel }]);
                setNewListLabel(""); // Réinitialise l'input après l'ajout
            } else {
                console.error("L'ajout de la liste a échoué, ID non retourné.");
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout de la liste :", error);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            handleAddList();
        }
    };

    const handleDeleteList = async (listId, listLabel) => {
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la liste "${listLabel}" et tous ses items ?`);

        if ( confirmDelete ) {
            const success = await window.api.deleteList(listId);

            if (success) {
                setLists(lists.filter(list => list.id !== listId));
            } else {
                console.error("La suppression a échoué.");
            }
        }
    };

    return (
    <aside className="list-navigation">
        <ul>
            {lists.map((list) => {
                const isActive = location.pathname === `/list/${list.id}`;

                return (
                    <li key={list.id}>
                        <Link to={`/list/${list.id}`} className={`list-navigation__item ${isActive ? "active" : ""}`}>
                            <span className="list-navigation__item-label">{list.label}</span>
                            <span className="list-navigation__item-icon list-navigation__item-delete" onClick={() => handleDeleteList(list.id, list.label)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                            </span>
                        </Link>
                    </li>
                )
            })}
            
            <li className="list-navigation__item list-navigation__item-add">
                <span className="list-navigation__item-label list-navigation__item-add-field">
                    <input
                        type="text"
                        placeholder="Ajouter une liste"
                        value={newListLabel}
                        onChange={(e) => setNewListLabel(e.target.value)}
                        onKeyDown={handleKeyPress} // Ajout de la gestion de la touche "Entrée"
                    />
                </span>
                <span className="list-navigation__item-icon list-navigation__item-icon-add" onClick={handleAddList}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                </span>
            </li>
        </ul>
    </aside>
    );
};

export default Navbar;
