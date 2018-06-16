import blessed from "blessed";
import contrib from "blessed-contrib";
import table from "./table";
import TableEditForm from "./tableEditForm";
import colors from "colors/safe";

class HexaTable {
  constructor(x, y, h, l, rowLength, grid, prompt, name) {
    this.rowLength = rowLength;
    this.headers = [];
    this.row = [];
    this.tableData = [];
    this.table = grid.set(x, y, h, l, table, {
      keys: true,
      mouse: true,
      interactive: true,
      vi: true,
      tags: true,
      align: "left",
      fg: "green",
      search: callback => {
        prompt.input("Search:", "", (err, value) => {
          if (err) return null;
          return callback(null, value);
        });
      },
      edit: callback => {},
      label: name,
      columnSpacing: 2,
      columnWidth: [4].concat(new Array(this.rowLength).fill(2))
    });

    for (let i = 0; i < this.rowLength; i++) {
      this.headers.push(i.toString(16));
    }
  }

  _setRow() {
    this.tableData.push(
      ["0x" + this.tableData.length.toString(16)].concat(this.row)
    );
  }

  set(data) {
    this.row = [];
    this.tableData = [];

    for (var i = 0; i < data.length; i++) {
      if (i % this.rowLength === 0 && i > 0) {
        this._setRow();
        this.row = [];
      }

      this.row.push(data[i].toString(16));
    }

    this._setRow();

    this.table.setData({
      headers: this.headers,
      data: this.tableData
    });
  }
}

class TUI {
  constructor() {
    this.screen = blessed.screen();
    this.activePage = "cpu";
    this.grid = new contrib.grid({ rows: 24, cols: 24, screen: this.screen });
    this.gridInfo = new contrib.grid({
      rows: 24,
      cols: 24,
      screen: this.screen
    });
    this.gridCPU = new contrib.grid({
      rows: 24,
      cols: 24,
      screen: this.screen
    });
    this.gridPPU = new contrib.grid({
      rows: 24,
      cols: 24,
      screen: this.screen
    });

    var self = this;
    this.prompt = null;
    this.log = null;
    this.cpuVariables = null;
    this.cpuZP = null;
    this.cpuStack = null;
    this.cpuRam = null;
    this.ppuVariables = null;
    this.ppuPaletteTable = null;
    this.ppuOAM = null;
    this.ppuNameTable1 = null;
    this.ppuNameTable2 = null;
    this.ppuAttributeTable1 = null;
    this.ppuAttributeTable2 = null;
    this.ppuPatternTables = null;
    this.romPRG = null;
    this.variablesHeaders = ["Name", "Value"];
    this.cpuVariablesKeys = [
      "PC",
      "SP",
      "A",
      "X",
      "Y",
      "C",
      "Z",
      "I",
      "D",
      "V",
      "N"
    ];

    // Add on item click => focus table
    // Move to table
    function info() {}

    function ppu() {
      self.prompt = self.gridPPU.set(12, 12, 12, 12, blessed.prompt, {
        top: "center",
        left: "center",
        keys: true,
        vi: true,
        mouse: true,
        tags: true,
        border: "line",
        hidden: false
      });

      console.log("hello1");

      self.ppuVariables = self.gridPPU.set(0, 0, 12, 6, table, {
        keys: true,
        mouse: true,
        interactive: true,
        vi: true,
        align: "left",
        fg: "green",
        label: "PPU Registers",
        columnSpacing: 2,
        columnWidth: [24, 6]
      });

      // TODO: Display colors
      self.ppuPaletteTable = new HexaTable(
        12,
        0,
        3,
        6,
        16,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Palette Table"
      );

      // TODO: Should display according to selected mirror
      // Also use & show attribute tables
      // Make 4 arrays, name table 1, attribute table 1, same for 2
      self.ppuOAM = new HexaTable(
        15,
        0,
        9,
        6,
        16,
        self.gridPPU,
        self.prompt,
        "PPU VRAM OAM"
      );

      self.ppuNameTable1 = new HexaTable(
        0,
        6,
        12,
        12,
        32,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Name Table 1"
      );

      self.ppuNameTable2 = new HexaTable(
        12,
        6,
        12,
        12,
        32,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Name Table 2"
      );

      self.ppuAttributeTable1 = new HexaTable(
        0,
        18,
        6,
        6,
        8,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Attribute Table 1"
      );

      self.ppuAttributeTable2 = new HexaTable(
        6,
        18,
        6,
        6,
        8,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Attribute Table 2"
      );

      self.activePage = "ppu";
    }

    function rom() {
      self.ppuPatternTables = new HexaTable(
        0,
        0,
        24,
        6,
        16,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Pattern Tables / CHR"
      );
      self.ppuPatternTables = new HexaTable(
        0,
        0,
        24,
        6,
        16,
        self.gridPPU,
        self.prompt,
        "PPU VRAM Pattern Tables / CHR"
      );

      self.romPRG = new HexaTable(
        0,
        6,
        24,
        6,
        16,
        self.gridPPU,
        self.prompt,
        "PRG"
      );

      self.activePage = "rom";
    }

    function cpu() {
      self.activePage = "cpu";
      self.prompt = self.grid.set(12, 12, 12, 12, blessed.prompt, {
        top: "center",
        left: "center",
        keys: true,
        vi: true,
        mouse: true,
        tags: true,
        border: "line",
        hidden: false
      });
      self.log = self.grid.set(0, 12, 24, 6, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: "Server Log"
      });
      self.cpuVariables = self.grid.set(0, 0, 6, 6, table, {
        keys: true,
        mouse: true,
        interactive: true,
        vi: true,
        align: "left",
        fg: "green",
        label: "CPU Registers",
        columnSpacing: 2,
        columnWidth: [6, 6]
      });
      self.cpuZP = new HexaTable(
        6,
        0,
        9,
        6,
        16,
        self.grid,
        self.prompt,
        "CPU RAM ZP"
      );

      self.cpuStack = new HexaTable(
        15,
        0,
        9,
        6,
        16,
        self.grid,
        self.prompt,
        "CPU RAM Stack"
      );
      self.cpuRAM = new HexaTable(
        0,
        6,
        24,
        6,
        16,
        self.grid,
        self.prompt,
        "CPU RAM"
      );
    }

    function page2(screen) {
      var line = contrib.line({
        width: 80,
        height: 30,
        left: 15,
        top: 12,
        xPadding: 5,
        label: "Title"
      });

      var data = [
        {
          title: "us-east",
          x: ["t1", "t2", "t3", "t4"],
          y: [0, 0.0695652173913043, 0.11304347826087, 2],
          style: {
            line: "red"
          }
        }
      ];

      screen.append(line);
      line.setData(data);

      var box = blessed.box({
        content:
          "click right-left arrows or wait 3 seconds for the next layout in the carousel",
        top: "80%",
        left: "10%"
      });
      screen.append(box);
    }

    this.screen.key(["escape", "q", "C-c"], function(ch, key) {
      return process.exit(0);
    });

    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    this.screen.on("resize", function() {});
    var carousel = new contrib.carousel([cpu, ppu, rom], {
      screen: this.screen,
      interval: 0, //how often to switch views (set 0 to never swicth automatically)
      controlKeys: true //should right and left keyboard arrows control view rotation
    });

    carousel.start();
  }

  setCPUVariables(data) {
    // Check why so slow. Maybe array allocation
    this.cpuVariables.setData({
      headers: this.variablesHeaders,
      data: data
    });
  }

  setPPUVariables(nes) {
    this.ppuVariables.setData({
      headers: ["Name", "Value"],
      data: [
        ["V", nes.ppu.v],
        ["T", nes.ppu.t],
        ["Y", nes.ppu.y],
        ["X", nes.ppu.x],
        ["W", nes.ppu.w],
        ["F", nes.ppu.f],
        ["Flag NameTable", nes.ppu.fNameTable],
        ["Flag Increment", nes.ppu.fIncrement],
        ["Flag SpriteTable", nes.ppu.fSpriteTable],
        ["Flag BackgroundTable", nes.ppu.fBackgroundTable],
        ["Flag SpriteSize", nes.ppu.fSpriteSize],
        ["Flag GrayScale", nes.ppu.fGrayscale],
        ["Flag ShowLeftBackground", nes.ppu.fShowLeftBackground],
        ["Flag ShowLeftSprites", nes.ppu.fShowLeftSprites],
        ["Flag ShowBackground", nes.ppu.fShowBackground],
        ["Flag ShowSprites", nes.ppu.fShowSprites],
        ["Flag RedTint", nes.ppu.fRedTint],
        ["Flag GreenTint", nes.ppu.fGreenTint],
        ["Flag BlueTint", nes.ppu.fBlueTint],
        ["Flag SpriteZeroHit", nes.ppu.fSpriteZeroHit],
        ["Flag SpriteOverflow", nes.ppu.fSpriteOverflow],
        ["OAM Address", nes.ppu.oamAddress],
        ["Buffered Data", nes.ppu.bufferedData]
      ]
    });
  }

  render() {
    this.screen.render();
  }
}

module.exports = new TUI();
