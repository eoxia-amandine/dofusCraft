import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';


const List = () => {
  const { id } = useParams(); // Récupère l'ID de l'URL

  return (
    <div>
      <h1>Liste de crafts pour l’ID : {id}</h1>
      <Link to="/">Listing</Link>
    </div>
  );
};

export default List;
