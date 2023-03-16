import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";

import { Engine, Scene, Vector3, HDRCubeTexture, MeshBuilder, FreeCamera, Color4, StandardMaterial, Color3, PointLight, ShadowGenerator, GlowLayer, Layer, Texture, UniversalCamera, VideoTexture } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { Environment } from "./environment";
import { texts } from "./dialogues";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {

    //General Entire Application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Game State Related
    private _environment;

    //Scene - related
    private _state: number = 0;
    private _gamescene: Scene;
    private _environmentTexture: string = "textures/sky.hdr"; //environment texture for HDRI and skybox

    constructor() {
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // run the main render loop 
        this._main();
    }

    private _createCanvas(): HTMLCanvasElement {

        //Commented out for development
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }

    private async _main(): Promise<void> {
        await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
        });

        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        let scene = new Scene(this._engine);
        let background = new Layer('background','', scene, true);
        const videoBackground = new VideoTexture('videoBackground', "textures/background.mp4", scene);
        background.texture = videoBackground;

        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //Create intro UI as a DOM HTML Element
        const introUI = document.getElementById('intro');

        //Description
        let descIndex = 0;
        const desc = document.getElementById("description");
        desc.innerHTML = texts['introduction'][0][descIndex];

        //click events on navigators
        document.getElementById("navigatorSx").onclick = function(){
            if(texts['introduction'][0][descIndex - 1]) {
                descIndex--;
                desc.innerHTML = texts['introduction'][0][descIndex];
                document.getElementById("navigatorDx").style.opacity = '1';
                if(!texts['introduction'][0][descIndex - 1]) {
                    document.getElementById("navigatorSx").style.opacity = '.5';
                }
            }
        };

        document.getElementById("navigatorDx").onclick = function(){
            if(texts['introduction'][0][descIndex + 1]) {
                descIndex++;
                desc.innerHTML = texts['introduction'][0][descIndex];
                document.getElementById("navigatorSx").style.opacity = '1';
                if(!texts['introduction'][0][descIndex + 1]) {
                    document.getElementById("navigatorDx").style.opacity = '.5';
                }
            }
        };

        const game = this;
        //this handles interactions with the start button attached to the scene
        document.getElementById("play").onclick = function(){
            game._goToGame();
        };

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;

        //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
        var finishedLoading = false;
        await this._setUpGame().then(res => {
            finishedLoading = true;
        });
    }

    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        //--CREATE ENVIRONMENT--
        const environment = new Environment(scene);
        this._environment = environment;
        await this._environment.load(); //environment
    }

    private async _initializeGameAsync(scene): Promise<void> {
        scene.ambientColor = new Color3(0.34509803921568627, 0.5568627450980392, 0.8352941176470589);
        scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

        const light = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
        light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        light.intensity = 35;
        light.radius = 1;

        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.4;

        //glow layer
        const gl = new GlowLayer("glow", scene);
        gl.intensity = 0.4;
        //webpack served from public
    }

    private async _goToGame() {
        //--SETUP SCENE--
        this._scene.detachControl();
        let scene = this._gamescene;
        scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098); // a color that fit the overall color scheme better

        //check if device is mobile or desktop, and change UI accordingly
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        }

        //dont detect any inputs from this ui while the game is loading
        scene.detachControl();

        //IBL (image based lighting) - to give scene an ambient light
        const envHdri = new HDRCubeTexture(this._environmentTexture, scene, 512);
        envHdri.name = "env";
        envHdri.gammaSpace = false;
        scene.environmentTexture = envHdri;
        scene.environmentIntensity = 0.3;

        //Create skybox
        // Skybox
	    var skybox = MeshBuilder.CreateSphere("skyBox", {diameter:1000.0}, scene);
	    var skyboxMaterial = new StandardMaterial("skyBox", scene);
	    skyboxMaterial.backFaceCulling = false;
	    skyboxMaterial.reflectionTexture = new HDRCubeTexture(this._environmentTexture, scene, 512);
	    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
	    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
	    skyboxMaterial.specularColor = new Color3(0, 0, 0);
	    skybox.material = skyboxMaterial;	

        //primitive character and setting
        await this._initializeGameAsync(scene);

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();

        document.getElementById('intro').remove();

        //Adding a light
        //var light = new PointLight("Omni", new Vector3(20, 20, 100), scene);

        // Need a free camera for collisions
        var camera = new UniversalCamera("Camera", new Vector3(0, 2, 0), scene);
        camera.attachControl(this._canvas, true);
        camera.speed = .3;

        //Add WASD Controls
        camera.keysUpward.push(69); //increase elevation
        camera.keysDownward.push(81); //decrease elevation
        camera.keysUp.push(87); //forwards 
        camera.keysDown.push(83); //backwards
        camera.keysLeft.push(65);
        camera.keysRight.push(68);

        //Set gravity for the scene (G force like, on Y-axis)
        scene.gravity = new Vector3(0, -0.9, 0);

        // Enable Collisions
        scene.collisionsEnabled = true;

        //Apply collisions and gravity to the active camera
        camera.checkCollisions = true;
        camera.applyGravity = true;

        //Set the ellipsoid around the camera
        camera.ellipsoid = new Vector3(1, 1.5, 1);

         // Move the light with the camera
        scene.registerBeforeRender(function () {
            //light.position = camera.position;
        });

        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();
    }
}
new App();