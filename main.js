import { Clock } from './clock.js';
import { LIGHT_SECOND_IN_WORLD_UNITS, METER_IN_WORLD_UNITS, SECTOR_SIZE_IN_WORLD_UNITS, } from './constants.js';
import { getNextContactId } from './contact_id.js';
import { GraphRenderer } from './graph_renderer.js';
import { Positions } from './operations/positions.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { Snapshot } from './snapshot.js';
import { SnapshotManager } from './snapshot_manager.js';
import { Updater } from './updater.js';
const clock = new Clock();
const snapshots = new SnapshotManager();
const computer = {};
const updater = new Updater();
const physics = new Physics();
const renderer = new Renderer();
const testGraphRenderer = new GraphRenderer(document.getElementById('systemsPage'), 'actualShips.:player-ship.systems.battery.charge', 'actualShips.:player-ship.systems.battery.capacity', 200, 100);
const enterprise = {
    id: getNextContactId(),
    exists: true,
    isPlayerShip: true,
    name: 'UNS_ENT',
    position: {
        sector: {
            x: 0,
            y: 0,
        },
        x: 0,
        y: 0,
    },
    facing: 0,
    linearVelocity: {
        dx: 1 * METER_IN_WORLD_UNITS,
        dy: 0 * METER_IN_WORLD_UNITS,
    },
    linearAcceleration: {
        ax: 9.8 * METER_IN_WORLD_UNITS,
        ay: 0,
    },
    angularVelocity: {
        yaw: 0,
    },
    angularAcceleration: {
        dyaw: 0,
    },
    systems: {
        reactor: {
            enabled: true,
            maxPowerOutput: 1000,
            powerOutput: 1000,
            powerOutputDelta: -100,
            minPowerOutputDelta: -100,
            maxPowerOutputDelta: 100,
        },
        battery: {
            enabled: true,
            capacity: 6000,
            charge: 0,
            maxPowerInput: 200,
            maxPowerOutput: 500,
            powerInput: 0,
            powerOutput: 0,
        },
        powerRegulator: {
            enabled: true,
            targetBatteryChargePercent: 0.5,
            tolerance: 0.1,
        },
        jumpDrive: {
            enabled: true,
            charging: false,
            charge: 0,
            destination: undefined,
            requestedPowerInput: 80,
            powerInput: 0,
            powerPriority: 0,
            maxPowerInput: 240,
            efficiency: 0.05,
            maxAcceleration: 1.0,
            capacity: 7200,
            operatingPower: 1200,
            driftRatioMedial: 0.15,
            driftRatioLateral: 0.05,
        },
    },
};
const reliant = {
    id: getNextContactId(),
    exists: true,
    isPlayerShip: false,
    name: 'UNS_REL',
    position: {
        sector: {
            x: 0,
            y: 0,
        },
        x: LIGHT_SECOND_IN_WORLD_UNITS,
        y: 42 * METER_IN_WORLD_UNITS,
    },
    facing: 0,
    linearVelocity: {
        dx: -LIGHT_SECOND_IN_WORLD_UNITS * 0.5,
        dy: 0,
    },
    linearAcceleration: {
        ax: 0,
        ay: 0,
    },
    angularVelocity: {
        yaw: 3,
    },
    angularAcceleration: {
        dyaw: 0,
    },
    systems: {
        reactor: {
            enabled: true,
            maxPowerOutput: 100,
            powerOutput: 100,
            powerOutputDelta: 0,
            minPowerOutputDelta: -10,
            maxPowerOutputDelta: 10,
        },
        battery: {
            enabled: true,
            capacity: 5000,
            charge: 2500,
            maxPowerInput: 200,
            maxPowerOutput: 500,
            powerInput: 0,
            powerOutput: 0,
        },
        powerRegulator: {
            enabled: true,
            targetBatteryChargePercent: 0.5,
            tolerance: 0.1,
        },
        jumpDrive: {
            enabled: true,
            charging: false,
            charge: 0,
            destination: undefined,
            requestedPowerInput: 0,
            powerInput: 0,
            powerPriority: 0,
            maxPowerInput: 240,
            efficiency: 0.05,
            maxAcceleration: 1.0,
            capacity: 7200,
            operatingPower: 1200,
            driftRatioMedial: 0.15,
            driftRatioLateral: 0.05,
        },
    },
};
const world = {
    staticObjects: [
        {
            name: 'Sun',
            radius: 695508000 * METER_IN_WORLD_UNITS,
            mass: 1.989e30,
            position: Positions.normalized({
                sector: {
                    x: 0,
                    y: 0,
                },
                x: SECTOR_SIZE_IN_WORLD_UNITS / 360 - (1.496e+11 * METER_IN_WORLD_UNITS),
                y: SECTOR_SIZE_IN_WORLD_UNITS / 360,
            }),
        },
        {
            name: 'Earth',
            radius: 6371000 * METER_IN_WORLD_UNITS,
            mass: 5.9722e24,
            position: {
                sector: {
                    x: 0,
                    y: 0,
                },
                x: SECTOR_SIZE_IN_WORLD_UNITS / 360,
                y: SECTOR_SIZE_IN_WORLD_UNITS / 360,
            },
        },
        {
            name: 'Moon',
            radius: 1737000 * METER_IN_WORLD_UNITS,
            mass: 7.34767309e22,
            position: {
                sector: {
                    x: 0,
                    y: 0,
                },
                x: SECTOR_SIZE_IN_WORLD_UNITS / 360 + 384401000 * METER_IN_WORLD_UNITS,
                y: SECTOR_SIZE_IN_WORLD_UNITS / 360,
            },
        },
        {
            name: 'Mars',
            radius: 3389000 * METER_IN_WORLD_UNITS,
            mass: 6.4169e23,
            position: Positions.normalized({
                sector: {
                    x: 0,
                    y: 0,
                },
                x: SECTOR_SIZE_IN_WORLD_UNITS / 360 + 225000000000 * METER_IN_WORLD_UNITS,
                y: SECTOR_SIZE_IN_WORLD_UNITS / 360,
            }),
        },
        {
            name: 'Jupiter',
            radius: 71492000 * METER_IN_WORLD_UNITS,
            mass: 1.898e27,
            position: Positions.normalized({
                sector: {
                    x: 0,
                    y: 0,
                },
                x: SECTOR_SIZE_IN_WORLD_UNITS / 360 + 628730000000 * METER_IN_WORLD_UNITS,
                y: SECTOR_SIZE_IN_WORLD_UNITS / 360,
            }),
        },
    ],
    apparentShips: [],
    actualShips: [],
};
snapshots.addSnapshot(enterprise.id, new Snapshot(clock.get(), enterprise));
// snapshots.addSnapshot(reliant.id, new Snapshot(clock.get(), reliant));
function runGameLoop() {
    clock.update();
    updater.update(world, clock, snapshots, computer);
    physics.simulate(world, clock, snapshots);
    renderer.render(world, computer);
    testGraphRenderer.render(world, computer, clock);
    window.requestAnimationFrame(runGameLoop);
    // (document.getElementById('debug') as HTMLElement).textContent =
    //    JSON.stringify(world.actualShips[0].systems, undefined, 2);
}
window.addEventListener('load', () => {
    console.log('Initializing game...');
    runGameLoop();
});
const plotJumpButton = document.getElementById('plotJumpButton');
plotJumpButton.addEventListener('activate', (event) => {
    computer.selectingJumpTarget = true;
});
//# sourceMappingURL=main.js.map