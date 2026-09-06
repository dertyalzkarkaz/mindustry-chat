const mapName = "portalCilistis";
const SERVER_URL = "https://onrender.com";
let currentMap = null;

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

function saveProgress() {
    if (currentMap && Vars.state.isGame()) {
        try {
            let myMod = getModInstance();
            if (myMod) {
                let mapFile = myMod.file.child("maps").child(mapName);
                MapIO.writeMap(mapFile, currentMap);
                Log.info("[Darklife] Sector progress successfully saved to file.");
            }
        } catch(e) {
            Log.err("[Darklife] Autosave error: " + e.message);
        }
    }
}

function startSector() {
    let myMod = getModInstance();
    if (myMod != null) {
        let mapFile = myMod.file.child("maps").child(mapName);
        if (mapFile.exists()) {
            currentMap = MapIO.createMap(mapFile, true);
            
            Core.app.post(() => {
                Vars.logic.reset();
                Vars.world.loadMap(currentMap);
                Vars.state.rules = currentMap.applyRules(Vars.state.rules.mode());
                Vars.logic.play();
                
                Vars.net.host(6567);
                Log.info("[Darklife] Global sector successfully started.");
                
                sendIpToRender();
            });
        } else {
            Log.err("Error: map file not found at " + mapFile.path());
        }
    } else {
        Log.err("Error: Mod 'Darklife' not found by server!");
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
        Log.info("[Darklife] Core destroyed! Resetting sector to initial state...");
        
        try {
            let myMod = getModInstance();
            if (myMod) {
                let mapFile = myMod.file.child("maps").child(mapName);
                if (mapFile.exists()) {
                    currentMap = MapIO.createMap(mapFile, true);
                    
                    Core.app.post(() => {
                        Vars.logic.reset();
                        Vars.world.loadMap(currentMap);
                        Vars.state.rules = currentMap.applyRules(Vars.state.rules.mode());
                        Vars.logic.play();
                        Log.info("[Darklife] Sector successfully reset and restarted!");
                    });
                }
            }
        } catch(e) {
            Log.err("[Darklife] Auto-restart error: " + e.message);
        }
    }
});
                        
