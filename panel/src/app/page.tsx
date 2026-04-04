"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState("yükleniyor...");

  useEffect(() => {
    fetch("http://localhost:4000")
      .then(res => res.json())
      .then(res => setData(res.status))
      .catch(() => setData("hata"));
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>PANEL AKTİF</h1>
      <p>{data}</p>
    </main>
  );
}
