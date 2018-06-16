// Shitty stuff for bootstrap...
window.jQuery = window.$ = require("jquery/dist/jquery.min");
require("bootstrap/dist/js/bootstrap.min.js");

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";

// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

//import "bootstrap";
import { remote } from "electron";
import jetpack from "fs-jetpack";
import { greet } from "./hello_world/hello_world";
import env from "env";
import Console from "nes";
import fs from "fs";
import blessed from "blessed";
import contrib from "blessed-contrib";
import {
  WebGLRenderer,
  CanvasRenderer,
  Texture,
  Sprite,
  Container,
  loader,
  Application
} from "pixi.js";
const app = remote.app;
var tui = remote.getCurrentWindow().tui;
const appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// files from disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read("package.json", "json");

const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux"
};

var nes = new Console();
var nesRunning = true;
var rom = fs.readFileSync(
  __dirname + "/../../react-nes-data/super-mario-bros.nes"
);

nes.loadROMData(rom);
nes.startDebug();

var watchingTick = false;
var watchingScanline = false;
var watchingFrame = false;
var scanlineNumber = document.querySelector("#scanlineNumber");
var frameNumber = document.querySelector("#frameNumber");

/*
document.querySelector("#app").style.display = "block";
document.querySelector("#greet").innerHTML = greet();
document.querySelector("#os").innerHTML = osMap[process.platform];
document.querySelector("#author").innerHTML = manifest.author;
document.querySelector("#env").innerHTML = env.name;
document.querySelector("#electron-version").innerHTML =
  process.versions.electron;
*/

function createPixiApp(div, width, height, realWidth, realHeight) {
  // return app, canvasimage, ctx, sprite
  var pixiApp = new Application({
    width: realWidth,
    height: realHeight,
    antialias: false,
    roundPixels: true,
    transparent: false,
    resolution: 1
  });

  //Add the canvas that Pixi automatically created for you to the HTML document
  document.querySelector(div).prepend(pixiApp.view);

  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext("2d");
  var texture = Texture.fromCanvas(canvas);
  var sprite = new Sprite(texture);
  var canvasImage = ctx.getImageData(0, 0, width, height);
  sprite.width = realWidth;
  sprite.height = realHeight;

  pixiApp.stage.addChild(sprite);

  return [pixiApp, canvasImage, ctx, sprite];
}

var [nesApp, nesCanvasImage, nesCtx, nesSprite] = createPixiApp(
  "#canvas-1",
  256,
  240,
  512,
  512
);

var [ptApp1, ptCanvasImage1, ptCtx1, ptSprite1] = createPixiApp(
  "#canvas-2",
  160,
  160,
  256,
  256
);

var [ptApp2, ptCanvasImage2, ptCtx2, ptSprite2] = createPixiApp(
  "#canvas-3",
  160,
  160,
  256,
  256
);

class NesDebugger {
  /**
    Bit of a monster class that listens to NES events and update GUI and TUI.
    Globals nightmare, close your eyes.
   */
  constructor() {}

  renderFrame(data) {
    nesCanvasImage.data.set(data);
    nesCtx.putImageData(nesCanvasImage, 0, 0);
    nesSprite.texture.update();
    nesApp.renderer.render(nesApp.stage);
  }

  renderPatternTables(data) {
    ptCanvasImage1.data.set(data[0]);
    ptCtx1.putImageData(ptCanvasImage1, 0, 0);
    ptSprite1.texture.update();
    ptApp1.renderer.render(ptApp1.stage);

    ptCanvasImage2.data.set(data[1]);
    ptCtx2.putImageData(ptCanvasImage2, 0, 0);
    ptSprite2.texture.update();
    ptApp2.renderer.render(ptApp2.stage);
  }

  updateTickValues() {
    scanlineNumber.value = nes.ppu.scanline;
    frameNumber.value = nes.frameNbr;
  }

  updateTUI(t) {
    this.renderPatternTables(nes.ppu.getPatternTables());

    switch (tui.activePage) {
      case "cpu": {
        tui.setCPUVariables(
          tui.cpuVariablesKeys.map((e, i) => {
            return [e, nes.cpu[e.toLowerCase()]];
          })
        );
        tui.cpuStack.set(nes.cpu.memory.stack);
        tui.cpuZP.set(nes.cpu.memory.zp);
        tui.cpuRAM.set(nes.cpu.memory.ram);
        break;
      }
      case "ppu": {
        tui.setPPUVariables(nes);
        tui.ppuNameTable1.set(nes.ppu.memory.nameTable.data.slice(0, 960));

        tui.ppuPaletteTable.set(nes.ppu.memory.paletteTable.data);
        tui.ppuAttributeTable1.set(
          nes.ppu.memory.nameTable.data.slice(960, 1024)
        );
        tui.ppuNameTable2.set(nes.ppu.memory.nameTable.data.slice(1024, 1984));
        tui.ppuAttributeTable2.set(
          nes.ppu.memory.nameTable.data.slice(1984, 2048)
        );

        tui.ppuOAM.set(nes.ppu.oamData);

        break;
      }
      case "rom": {
        tui.ppuPatternTables.set(nes.ppu.memory.mapper.chr.data);
        tui.romPRG.set(nes.ppu.memory.mapper.prg.data);
        break;
      }
    }
    tui.render();
  }

  notify(t, e) {
    switch (t) {
      case "cpu-tick": {
        if (!nesRunning && (watchingTick || watchingScanline)) {
          // Only update when necessary because it would make the browser crash
          // otherwhise
          this.updateTickValues();
          this.updateTUI();

          tui.log.log(
            e[0] +
              " => " +
              e[1] +
              " " +
              e[2] +
              " Size " +
              e[3] +
              " Cycles " +
              e[4] +
              " Addr " +
              e[5]
          );
        }
        break;
      }
      case "frame-ready": {
        if (!nesRunning && watchingFrame) {
          this.updateTickValues();
        }
        this.renderFrame(e);
        break;
      }
      // TODO: Add mapper, rom info data
      case "frame-ready-debug": {
        this.updateTUI();
        break;
      }
    }
  }
}

/**
 *  Events listeners
 */

document.querySelector("#nextTick").addEventListener("click", () => {
  watchingTick = true;
  nes.tickDebug();
  watchingTick = false;
});

document.querySelector("#nextScanline").addEventListener("click", () => {
  let done = false;
  let curScanline = nes.ppu.scanline;

  watchingScanline = true;

  while (!done) {
    nes.tickDebug();
    done = nes.ppu.scanline !== curScanline;
  }

  watchingScanline = false;
});

document.querySelector("#nextFrame").addEventListener("click", () => {
  let done = false;

  watchingFrame = true;

  while (!done) {
    done = !nes.tickDebug();
  }

  watchingFrame = false;
});

document.querySelector("#nesPauseToggle").addEventListener("click", () => {
  if (nesRunning) {
    nes.stop();
  } else {
    nes.startDebug();
  }
  nesRunning = !nesRunning;
});

var nesDebug = new NesDebugger();
nes.addObserver(nesDebug);

// For console debugging
window.nes = nes;
