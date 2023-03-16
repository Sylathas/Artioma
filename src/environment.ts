import { Scene, SceneLoader} from "@babylonjs/core";

export class Environment {
    private _scene: Scene;

    //Meshes
    public environmentModel: string = "Layout.gltf"; //mesh of the map

    constructor(scene: Scene) {
        this._scene = scene;
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
    public async load() {
        const assets = await this._loadAsset();
        //Loop through all environment meshes that were imported
        assets.allMeshes.forEach((m) => {
            if (m.name.includes("collision")) {
                m.checkCollisions = true;
                m.isPickable = true;
                m.isVisible = false;
            } else if (m.name.includes("cloth")) {
                m.checkCollisions = true;
                m.isPickable = true;
            } else {
                m.checkCollisions = false;
                m.isPickable = false;
            }
        });
    }

    private async _loadAsset() {
        //load environment mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", this.environmentModel, this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        return {
            env: env, //reference to our entire imported glb (meshes and transform nodes)
            allMeshes: allMeshes, // all of the meshes that are in the environment
        };
    }
}