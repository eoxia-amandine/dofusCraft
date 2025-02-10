import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [endpoint, setEndpoint] = useState("fr/mounts/all");

  const fetchData = async () => {
    const result = await window.api.fetchDofusData(endpoint);
    setData(result);
  };

  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");

  // Charger les joueurs depuis la BDD au démarrage
  useEffect(() => {
    window.api.getPlayers().then((data) => {
      if (!data.error) {
        setPlayers(data);
      } else {
        console.error("Erreur BDD :", data.error);
      }
    });
  }, []);

  const addPlayer = async () => {
    if (!name) return;
    await window.api.addPlayer(name);
    setName(""); // Réinitialiser le champ
    setPlayers(await window.api.getPlayers()); // Rafraîchir la liste
  };

  return (
    <div>
      <h1>API Dofus³ avec Electron</h1>
      
      <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
        <option value="fr/mounts/all">Montures</option>
      </select>

      <button onClick={fetchData}>Récupérer les données</button>

      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}

      <h1>Liste des joueurs</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du joueur"
      />
      <button onClick={addPlayer}>Ajouter</button>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name} (Niveau {player.level})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
