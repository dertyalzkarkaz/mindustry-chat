const SERVER_URL = "https://mindustry-chat.onrender.com";
let currentSector = null;

function getModInstance() {
    let allMods = Vars.mods.list();
    for (let i = 0; i < allMods.size; i++) {
        let m = allMods.get(i);
        let mName = m.name.toLowerCase();
        if (mName.includes("darklife") || m.meta.name.toLowerCase().includes("darklife")) {
            return m;
        }
    }
    return null;
}

function getRandomSector() {
    let planets = [Planets.serpulo, Planets.erekir];
    let randomPlanet = planets[Math.floor(Math.random() * planets.length)];
    let sectors = randomPlanet.sectors;
    
    if (sectors && sectors.size > 0) {
        let randomSector = sectors.get(Math.floor(Math.random() * sectors.size));
        return randomSector;
    }
    return null;
}

function startRandomSector() {
    try {
        let sector = getRandomSector();
        if (sector == null) {
            Log.err("[Darklife] Failed to pick a random sector. Defaulting to Serpulo Sector 0.");
            sector = Planets.serpulo.sectors.get(0);
        }
        
        currentSector = sector;
        Log.info("[Darklife] Selected Planet: " + sector.planet.localizedName + " | Sector: " + sector.id);

        Core.app.post(() => {
            Vars.logic.reset();
            
            sector.generatePreset();
            let customMap = sector.map;
            
            Vars.world.loadMap(customMap);
            Vars.state.rules = customMap.applyRules(Vars.state.rules.mode());
            Vars.logic.play();
            
            Vars.net.host(6567);
            Log.info("[Darklife] Global random sector successfully started.");
            
            sendIpToRender();
        });
    } catch(e) {
        Log.err("[Darklife] Error generation sector: " + e.message);
    }
}

function saveProgress() {
    if (currentSector && Vars.state.isGame()) {
        try {
            Core.app.post(() => {
                Vars.control.saves.saveCurrent();
                Log.info("[Darklife] Sector progress successfully saved to global server memory.");
            });
        } catch(e) {
            Log.err("[Darklife] Autosave error: " + e.message);
        }
    }
}

function sendIpToRender() {
    try {
        Http.get("https://ipify.org").submit(res => {
            if (res.getStatus() == 200) {
                let ipData = JSON.parse(res.getResultAsString());
                let publicIp = ipData.ip;

                let request = Http.post(`${SERVER_URL}/api/set-main-server`);
                request.header("Content-Type", "application/json");
                request.content = JSON.stringify({ ip: publicIp, port: 6567 });
                
                request.submit(response => {
                    if (response.getStatus() == 200) {
                        Log.info("[Darklife] Current IP successfully sent to Render: " + publicIp);
                    } else {
                        Log.err("[Darklife] Render rejected IP. Status: " + response.getStatus());
                    }
                });
            }
        });
    } catch(e) {
        Log.err("[Darklife] Failed to send IP: " + e.message);
    }
}

Events.on(ServerLoadEvent, () => {
    startSector();
    
    Timer.schedule(() => {
        saveProgress();
    }, 300, 300);
});

Events.on(GameOverEvent, event => {
    if (event.winner === Team.crux) {
        Log.info("[Darklife] Core destroyed! Traveling to a new random planet sector...");
        startRandomSector();
    }
});
