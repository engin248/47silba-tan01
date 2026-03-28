module.exports = {
    apps: [
        {
            name: "mizanet-karargah-ui",
            script: "npm",
            args: "run start", // Next.js Production Build
            instances: 1,
            autorestart: true, // Çökerse kendi kendini diriltir (Sentinel Kalkanı)
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production"
            }
        },
        {
            name: "mizanet-otonom-is-motoru",
            script: "./worker.js", // Arka plandaki 3 fazlı Pipeline Ajani
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "800M",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
