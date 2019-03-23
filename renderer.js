import { LIGHT_HOUR_IN_WORLD_UNITS, LIGHT_MINUTE_IN_WORLD_UNITS, LIGHT_SECOND_IN_WORLD_UNITS, METER_IN_WORLD_UNITS, SECTOR_SIZE_IN_WORLD_UNITS, WORLD_UNIT_IN_METERS, } from './constants.js';
import { Positions } from './operations/positions.js';
import { WorldPoint, WorldRect } from './types.js';
const CANVAS_WIDTH_PX = 600;
const CANVAS_HEIGHT_PX = 600;
/**
 * Possible UI interaction modes.
 */
var UIMode;
(function (UIMode) {
    /**
     * Clicking on the map will select objects.
     */
    UIMode[UIMode["SELECT"] = 0] = "SELECT";
    /**
     * Clicking on the map will set a jump target.
     */
    UIMode[UIMode["JUMP_TARGET"] = 1] = "JUMP_TARGET";
})(UIMode || (UIMode = {}));
/**
 * Possible user commands that can be entered into a ship computer.
 */
var UserCommand;
(function (UserCommand) {
    /**
     * No command is pending.
     */
    UserCommand[UserCommand["NONE"] = 0] = "NONE";
    /**
     * Engage and begin charging the jump drive.
     */
    UserCommand[UserCommand["JUMP"] = 1] = "JUMP";
})(UserCommand || (UserCommand = {}));
/**
 * Renders the world into a canvas element, and handles input events on the canvas.
 *
 * ## Computer commands
 *
 * The renderer receives a `computer` object representing the player's ship's computer.  This is
 * really just a read-write buffer that exists outside of the simulated world and allows the
 * renderer to communicate with the updater, which processes commands from the computer buffer and
 * applies them to the ship's systems.  When the player interacts with the canvas, the computer
 * buffer may be modified so that the updater can execute the commands next frame.
 *
 * ## Coordinate systems
 *
 * There are four coordinate systems that can potentially be used in the renderer:
 *
 *  - Screen space logical pixels: One unit equals a logical pixel on the screen.
 *  - Screen space physical pixels: One unit equals a physical pixel on the screen.
 *  - World space: One unit equals a world unit, which is an arbitrary size designed to optimize
 *    rendering across large distances.
 *  - Meters: One unit equals a meter in world space.
 *
 * In general, we try to use world space units whenever possible, and convert to/from logical or
 * physical pixels as needed.  We avoid using meters whenever we can, since that results in very
 * large numbers.
 *
 * ## Normalization
 *
 * In order to minimize rounding errors, before drawing each frame we renormalize the world
 * so that the objects within the viewport are relatively close to the point 0, 0 in world space.
 * This does not actually modify the world model, and the renormalized copy of the world is only
 * used internally by the renderer.  When converting screen space to world space, you must specify
 * whether you want normalized or true coordinates.  Bear in mind that the true coordinates may be
 * very large.
 */
export class Renderer {
    constructor() {
        /**
         * The scale factor between world units and logical pixels.  The default value is 1/600 ls per lpx
         * (so the entire viewport is 1 ls wide).
         */
        this._scaleFactor = 1 / LIGHT_SECOND_IN_WORLD_UNITS * CANVAS_WIDTH_PX;
        /**
         * The true world origin, that is, the unnormalized world space position of the canvas's top left
         * corner.  This will change when the user pans or zooms the map.
         */
        this._trueWorldOrigin = new WorldPoint(0, 0);
        /**
         * The normalized world origin, that is, the normalized world space position of the canvas's top
         * left corner.  This will change when the true world origin changes or when the world origin is
         * renormalized.
         */
        this._worldOrigin = new WorldPoint(0, 0);
        /**
         * The mouse cursor's current position in true world space coordinates.
         */
        this._trueMousePosition = new WorldPoint(0, 0);
        /**
         * The mouse cursor's current position in normalized world space coordinates.
         */
        this._mousePosition = new WorldPoint(0, 0);
        /**
         * The current UI mode.
         */
        this._uiMode = UIMode.SELECT;
        /**
         * The currently pending user command.
         */
        this._userCommand = UserCommand.NONE;
        /**
         * The canvas element.
         */
        this._canvas = document.getElementById('tactical');
        /**
         * The distance formatter.
         */
        this._distanceFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
        this._shipPath = new Path2D();
        this._shipPath.moveTo(8, 0);
        this._shipPath.lineTo(-8, 6);
        this._shipPath.lineTo(-4, 0);
        this._shipPath.lineTo(-8, -6);
        this._shipPath.lineTo(8, 0);
        this._canvas.style.width = this._canvas.width + 'px';
        this._canvas.style.height = this._canvas.height + 'px';
        this._canvas.width *= window.devicePixelRatio;
        this._canvas.height *= window.devicePixelRatio;
        const mapPanMouseHandler = this._mapPanMouseHandler.bind(this);
        const mousePositionRecordingHandler = this._mousePositionRecordingHandler.bind(this);
        this._canvas.addEventListener('wheel', this._wheelHandler.bind(this));
        this._canvas.addEventListener('mousemove', mousePositionRecordingHandler);
        this._canvas.addEventListener('mousedown', (event) => {
            this._canvas.addEventListener('mousemove', mapPanMouseHandler);
        });
        this._canvas.addEventListener('mouseup', () => {
            this._canvas.removeEventListener('mousemove', mapPanMouseHandler);
        });
        this._canvas.addEventListener('mouseout', () => {
            this._canvas.removeEventListener('mousemove', mapPanMouseHandler);
        });
        this._canvas.addEventListener('click', (event) => {
            if (this._uiMode === UIMode.JUMP_TARGET) {
                this._userCommand = UserCommand.JUMP;
            }
        });
    }
    /**
     * Renders the scene and executes user commands.
     * @param world The world to render.  This is read-only because the renderer may not mutate the
     *     world.
     * @param computer The computer object for the player's ship.  This is a mutable reference so it
     *     can be modified by the renderer if the user enters commands.
     */
    render(world, computer) {
        this._setUIMode(computer);
        this._executeUserCommands(computer);
        const normalizedWorld = this._getNormalizedWorld(world);
        const ctx = this._canvas.getContext('2d');
        this._setScreenSpaceTransform(ctx);
        ctx.clearRect(0, 0, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX);
        this._setWorldSpaceTransform(ctx);
        ctx.save();
        this._drawSectors(ctx);
        this._drawStaticObjects(normalizedWorld, ctx);
        this._drawShips(normalizedWorld, ctx);
        this._drawJumpTarget(normalizedWorld, ctx);
        this._drawScale(ctx);
        ctx.restore();
        //     this._setDebugText(`
        // True origin: ${this._trueWorldOrigin.x}, ${this._trueWorldOrigin.y}
        // Norm origin: ${this._worldOrigin.x}, ${this._worldOrigin.y}`);
    }
    /**
     * Returns a translated version of `world` where all objects' positions have been shifted over by
     * [`x`, `y`].
     * @param world The world to translate, which should have unnormalized positions.
     * @param x The amount to translate horizontally by in world units.
     * @param y The amount to translate vertically by in world units.
     * @return A translated version of `world`.
     */
    _getWorldTranslatedBy(world, x, y) {
        const newWorld = JSON.parse(JSON.stringify(world));
        let objects = newWorld.actualShips.concat(newWorld.apparentShips);
        objects = objects.concat(newWorld.staticObjects);
        for (const object of objects) {
            const position = object.position;
            position.x += x;
            position.y += y;
            object.position = Positions.normalized(position);
        }
        return newWorld;
    }
    /**
     * Returns a copy of `world` where all coordinates have been normalized, which is to say
     * translated so that the world coordinates of the canvas origin (the top left corner) are in
     * sector 0,0.  This reduces rounding errors when drawing objects.
     * @param world The world to normalize.
     * @return A normalized version of `world`.
     */
    _getNormalizedWorld(world) {
        const normalizedWorld = world;
        this._worldOrigin = new WorldPoint(this._trueWorldOrigin.x, this._trueWorldOrigin.y);
        let xTranslation = 0;
        let yTranslation = 0;
        while (this._worldOrigin.x < -SECTOR_SIZE_IN_WORLD_UNITS) {
            xTranslation += SECTOR_SIZE_IN_WORLD_UNITS;
            this._worldOrigin.x += SECTOR_SIZE_IN_WORLD_UNITS;
        }
        while (this._worldOrigin.x > SECTOR_SIZE_IN_WORLD_UNITS) {
            xTranslation -= SECTOR_SIZE_IN_WORLD_UNITS;
            this._worldOrigin.x -= SECTOR_SIZE_IN_WORLD_UNITS;
        }
        while (this._worldOrigin.y < -SECTOR_SIZE_IN_WORLD_UNITS) {
            yTranslation += SECTOR_SIZE_IN_WORLD_UNITS;
            this._worldOrigin.y += SECTOR_SIZE_IN_WORLD_UNITS;
        }
        while (this._worldOrigin.y > SECTOR_SIZE_IN_WORLD_UNITS) {
            yTranslation -= SECTOR_SIZE_IN_WORLD_UNITS;
            this._worldOrigin.y -= SECTOR_SIZE_IN_WORLD_UNITS;
        }
        return this._getWorldTranslatedBy(world, xTranslation, yTranslation);
    }
    /**
     * Loads data into `computer` based on the pending user command and data.  For example, if a jump
     * has been committed in the UI, loads the jump destination into the computer and marks the jump
     * as committed.
     * @param computer The computer object to modify.
     */
    _executeUserCommands(computer) {
        if (this._userCommand === UserCommand.JUMP) {
            computer.selectingJumpTarget = false;
            computer.jumpCommitted = true;
            computer.jumpDestination = Positions.getPositionForWorldPoint(this._trueMousePosition);
        }
        this._userCommand = UserCommand.NONE;
    }
    /**
     * Sets the UI mode based on the state of `computer`.  For example, if the computer indicates that
     * the player is selecting a jump target, we will set our UI mode to JUMP_TARGET.
     * @param computer The computer object to read from.
     */
    _setUIMode(computer) {
        if (computer.selectingJumpTarget) {
            this._uiMode = UIMode.JUMP_TARGET;
        }
        else {
            this._uiMode = UIMode.SELECT;
        }
    }
    /**
     * DOM event handler for mouse wheel zoom.  Scales the world up or down and recenters it on the
     * mouse location when the wheel event occurred.
     * @param event
     */
    _wheelHandler(event) {
        const canvasRect = this._canvas.getBoundingClientRect();
        const localX = event.x - canvasRect.left;
        const localY = event.y - canvasRect.top;
        const mouseWorldCoords = this._toTrueWorldCoordinates(localX, localY);
        let deltaY = event.deltaY;
        if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
            deltaY /= 36.0;
        }
        this._scaleFactor *= (1 + (-deltaY * 0.1));
        this._scaleFactor = Math.max(1.0e-11 * WORLD_UNIT_IN_METERS, Math.min(this._scaleFactor, 1.0 * WORLD_UNIT_IN_METERS));
        this._trueWorldOrigin.x = mouseWorldCoords.x - this._lpxToWorldUnits(localX);
        this._trueWorldOrigin.y = mouseWorldCoords.y - this._lpxToWorldUnits(localY);
        event.preventDefault();
    }
    /**
     * DOM event handler for mouse movement.  Records the mouse position in world space whenever the
     * mouse moves.
     * @param event
     */
    _mousePositionRecordingHandler(event) {
        const canvasRect = this._canvas.getBoundingClientRect();
        const localX = event.x - canvasRect.left;
        const localY = event.y - canvasRect.top;
        this._mousePosition = this._toNormalizedWorldCoordinates(localX, localY);
        this._trueMousePosition = this._toTrueWorldCoordinates(localX, localY);
    }
    /**
     * DOM event handler for mouse dragging.  Translates the world origin based on the drag.
     * @param event
     */
    _mapPanMouseHandler(event) {
        if (navigator.userAgent.indexOf('Chrome') > 0) {
            this._trueWorldOrigin.x -= this._ppxToWorldUnits(event.movementX);
            this._trueWorldOrigin.y -= this._ppxToWorldUnits(event.movementY);
        }
        else {
            this._trueWorldOrigin.x -= this._lpxToWorldUnits(event.movementX);
            this._trueWorldOrigin.y -= this._lpxToWorldUnits(event.movementY);
        }
    }
    /**
     * Renders all the static object (planets, moons, etc) in the world.  Also draws an exclusion zone
     * around the object that indicates where the jump drive may not be safely used due to a
     * gravitational acceleration of >= 1m/s^2.
     * @param world The world to be rendered.
     * @param ctx The graphics context to render into.
     */
    _drawStaticObjects(world, ctx) {
        ctx.save();
        ctx.lineWidth = this._ppxToWorldUnits(1.0);
        for (const staticObject of world.staticObjects) {
            ctx.save();
            const rawPosition = Positions.getWorldPointForPosition(staticObject.position);
            if (!this._isOnscreen(new WorldRect(rawPosition.x - staticObject.radius, rawPosition.y - staticObject.radius, staticObject.radius * 2, staticObject.radius * 2))) {
                continue;
            }
            const objectRadius = Math.max(staticObject.radius, this._lpxToWorldUnits(4.0));
            const maxJumpDriveAccel = this._getPlayerShip(world).systems.jumpDrive.maxAcceleration;
            const oneMeterPerSecondSquaredAccel = (Math.sqrt(staticObject.mass) * Math.sqrt(6.674e-11) / Math.sqrt(maxJumpDriveAccel))
                * METER_IN_WORLD_UNITS;
            const exclusionRadius = Math.max(oneMeterPerSecondSquaredAccel, this._lpxToWorldUnits(4.0));
            ctx.strokeStyle = '#FF0000';
            ctx.setLineDash([this._lpxToWorldUnits(4.0), this._lpxToWorldUnits(4.0)]);
            ctx.beginPath();
            ctx.ellipse(rawPosition.x, rawPosition.y, exclusionRadius, exclusionRadius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#8080FF';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.ellipse(rawPosition.x, rawPosition.y, objectRadius, objectRadius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.clip();
            const rect = new WorldRect(rawPosition.x - objectRadius, rawPosition.y - objectRadius, objectRadius * 2, objectRadius * 2);
            this._drawHatchingInRect(ctx, rect);
            ctx.restore();
            this._drawLabelAtWorldSpacePoint(ctx, staticObject.name, new WorldPoint(rawPosition.x + staticObject.radius, rawPosition.y), {
                fillStyle: '#8080FF',
                offset: 8,
            });
        }
        ctx.restore();
    }
    /**
     * Renders all the ships in the world.  The apparent positions of the ships from the point of view
     * of the player ship will be rendered.
     * @param world The world to be rendered.
     * @param ctx The graphics context to render into.
     */
    _drawShips(world, ctx) {
        ctx.save();
        ctx.setLineDash([]);
        // Debugging: draw actual ship positions too, but in a dimmer color.
        for (const ship of world.actualShips || []) {
            ctx.save();
            const rawPosition = Positions.getWorldPointForPosition(ship.position);
            ctx.translate(rawPosition.x, rawPosition.y);
            const spriteScale = this._lpxToWorldUnits(1.0);
            ctx.scale(spriteScale, spriteScale);
            ctx.rotate(ship.facing * Math.PI / 180);
            ctx.fillStyle = '#002200';
            ctx.fill(this._shipPath);
            ctx.restore();
        }
        for (const ship of world.apparentShips) {
            ctx.save();
            const rawPosition = Positions.getWorldPointForPosition(ship.position);
            ctx.translate(rawPosition.x, rawPosition.y);
            const spriteScale = this._lpxToWorldUnits(1.0);
            ctx.scale(spriteScale, spriteScale);
            ctx.rotate(ship.facing * Math.PI / 180);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1.0;
            ctx.stroke(this._shipPath);
            this._drawLabelAtWorldSpacePoint(ctx, ship.name, rawPosition, {
                fillStyle: '#00FF00',
                offset: 12,
            });
            ctx.restore();
        }
        ctx.restore();
    }
    /**
     * Renders any sector boundaries that are visible on the map.  Sector boundaries are drawn with
     * solid lines, and subsector boundaries (1/60 sector, aka one light second) are drawn with dotted
     * lines.
     * @param world The world to be rendered.
     * @param ctx The graphics context to render into.
     */
    _drawSectors(ctx) {
        ctx.save();
        ctx.lineWidth = this._ppxToWorldUnits(1.0);
        ctx.strokeStyle = '#006600';
        const extents = this._getNormalizedExtentsInWorldUnits();
        if (extents.width < LIGHT_MINUTE_IN_WORLD_UNITS) {
            const firstLineX = Math.trunc(extents.left / LIGHT_SECOND_IN_WORLD_UNITS) * LIGHT_SECOND_IN_WORLD_UNITS;
            ctx.setLineDash([this._lpxToWorldUnits(2.0), this._lpxToWorldUnits(2.0)]);
            ctx.beginPath();
            for (let i = firstLineX; i < extents.right; i += LIGHT_SECOND_IN_WORLD_UNITS) {
                ctx.moveTo(i, extents.top);
                ctx.lineTo(i, extents.bottom);
            }
            const firstLineY = Math.trunc(extents.top / LIGHT_SECOND_IN_WORLD_UNITS) * LIGHT_SECOND_IN_WORLD_UNITS;
            for (let i = firstLineY; i < extents.bottom; i += LIGHT_SECOND_IN_WORLD_UNITS) {
                ctx.moveTo(extents.left, i);
                ctx.lineTo(extents.right, i);
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.beginPath();
        if (extents.width < LIGHT_HOUR_IN_WORLD_UNITS) {
            const firstLineX = Math.trunc(extents.left / LIGHT_MINUTE_IN_WORLD_UNITS) * LIGHT_MINUTE_IN_WORLD_UNITS;
            for (let i = firstLineX; i < extents.right; i += LIGHT_MINUTE_IN_WORLD_UNITS) {
                ctx.moveTo(i, extents.top);
                ctx.lineTo(i, extents.bottom);
            }
            const firstLineY = Math.trunc(extents.top / LIGHT_MINUTE_IN_WORLD_UNITS) * LIGHT_MINUTE_IN_WORLD_UNITS;
            for (let i = firstLineY; i < extents.bottom; i += LIGHT_MINUTE_IN_WORLD_UNITS) {
                ctx.moveTo(extents.left, i);
                ctx.lineTo(extents.right, i);
            }
            ctx.stroke();
        }
        ctx.restore();
    }
    /**
     * Renders a label at a given world space point.
     * @param ctx The graphics context to render into.
     * @param text The text to render.
     * @param point The world space point to render the text at.
     * @param options Options for rendering the label.
     */
    _drawLabelAtWorldSpacePoint(ctx, text, point, options) {
        ctx.save();
        // Draw this in screen space.
        this._setScreenSpaceTransform(ctx);
        let offset = 0;
        if (options) {
            if (options.fillStyle) {
                ctx.fillStyle = options.fillStyle;
            }
            offset = options.offset || 0;
            ctx.textAlign = options.alignment || 'left';
            ctx.textBaseline = options.baseline || 'middle';
            ctx.font = options.font || '0.8em monospace';
        }
        const coords = this._fromNormalizedWorldCoordinates(point.x, point.y);
        ctx.fillText(text, coords.x + offset, coords.y);
        ctx.restore();
    }
    /**
     * Returns the cartesian distance between two world space coordinates.  This distance will always
     * be a positive number.
     * @param from The point to measure from.
     * @param to The point to measure to.
     */
    _getDistanceInWorldUnits(from, to) {
        const distanceX = from.x - to.x;
        const distanceY = from.y - to.y;
        return Math.abs(Math.hypot(distanceX, distanceY));
    }
    /**
     * Returns a read-only reference to the player ship.
     * @param world The world to extract the ship from.
     */
    _getPlayerShip(world) {
        const playerShip = world.actualShips.find((ship) => ship.exists && ship.isPlayerShip);
        if (!playerShip) {
            throw new Error('Player ship not found in ships list!');
        }
        return playerShip;
    }
    /**
     * Draws the jump targeting UI, if and only if we are in JUMP_TARGET UI mode.
     *
     * The jump targeting UI consists of a large circle representing the maximum jump radius, and a
     * small ellipse indicating the 95% confidence interval of the jump destination around the current
     * mouse position.  Both of these are calculated using the properties of the installed jump drive.
     * @param world The world to read jump drive info from.
     * @param ctx The context to render into.
     */
    _drawJumpTarget(world, ctx) {
        if (this._uiMode !== UIMode.JUMP_TARGET) {
            return;
        }
        ctx.save();
        // Draw max jump radius.
        // TODO: Only draw as much of the arc as is visible on screen.
        const extents = this._getNormalizedExtentsInWorldUnits();
        const playerShip = this._getPlayerShip(world);
        const rawPosition = Positions.getWorldPointForPosition(playerShip.position);
        const jumpDrive = playerShip.systems.jumpDrive;
        const maxJumpRadius = (jumpDrive.capacity - jumpDrive.operatingPower) *
            jumpDrive.efficiency * LIGHT_SECOND_IN_WORLD_UNITS;
        let shouldDrawJumpRadius = true;
        if (this._getDistanceInWorldUnits(rawPosition, new WorldPoint(extents.left, extents.top)) < maxJumpRadius &&
            this._getDistanceInWorldUnits(rawPosition, new WorldPoint(extents.left, extents.bottom)) < maxJumpRadius &&
            this._getDistanceInWorldUnits(rawPosition, new WorldPoint(extents.right, extents.top)) < maxJumpRadius &&
            this._getDistanceInWorldUnits(rawPosition, new WorldPoint(extents.right, extents.bottom)) < maxJumpRadius) {
            // Viewport is entirely within the jump radius.
            shouldDrawJumpRadius = false;
        }
        ctx.lineWidth = this._ppxToWorldUnits(1.0);
        ctx.setLineDash([this._lpxToWorldUnits(4.0), this._lpxToWorldUnits(4.0)]);
        if (shouldDrawJumpRadius) {
            ctx.strokeStyle = '#FF0000';
            ctx.beginPath();
            ctx.ellipse(rawPosition.x, rawPosition.y, maxJumpRadius, maxJumpRadius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.clip();
        }
        // Draw jump target confidence ellipse.
        ctx.strokeStyle = '#8080FF';
        const distance = this._getDistanceInWorldUnits(rawPosition, this._mousePosition);
        const angleRadians = Math.atan2(rawPosition.y - this._mousePosition.y, rawPosition.x - this._mousePosition.x);
        ctx.beginPath();
        const semiMinorAxis = jumpDrive.driftRatioLateral * distance;
        const semiMajorAxis = jumpDrive.driftRatioMedial * distance;
        ctx.ellipse(this._mousePosition.x, this._mousePosition.y, semiMajorAxis, semiMinorAxis, angleRadians, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    /**
     * Draws some text indicating the scale of the map, specifically the distance between the left and
     * right edges of the canvas in world space.
     * @param ctx The context to render into.
     */
    _drawScale(ctx) {
        ctx.save();
        // Draw this in screen space.
        this._setScreenSpaceTransform(ctx);
        const extents = this._getNormalizedExtentsInWorldUnits();
        let text = '';
        if (extents.width > LIGHT_MINUTE_IN_WORLD_UNITS / 10) {
            text = `${this._distanceFormatter.format(extents.width / LIGHT_MINUTE_IN_WORLD_UNITS)} lm`;
        }
        else if (extents.width > LIGHT_SECOND_IN_WORLD_UNITS / 10) {
            text = `${this._distanceFormatter.format(extents.width / LIGHT_SECOND_IN_WORLD_UNITS)} ls`;
        }
        else if (extents.width > 100000 * METER_IN_WORLD_UNITS) {
            text = `${this._distanceFormatter.format(extents.width / METER_IN_WORLD_UNITS / 1000)} km`;
        }
        else {
            text = `${this._distanceFormatter.format(extents.width / METER_IN_WORLD_UNITS)} m`;
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.font = '0.8em monospace';
        ctx.fillStyle = '#99FF99';
        ctx.fillText(text, CANVAS_WIDTH_PX - 8, CANVAS_HEIGHT_PX - 8);
        ctx.restore();
    }
    /**
     * Given a rectangle in world coordinates, draws hatching lines within that rectangle.  Only lines
     * that at least partially appear inside the current viewport will be drawn.  This does not reset
     * the graphics context, so it will use whatever line style is currently set on the context, and
     * you can fill other shapes by setting a clipping path before calling this method.
     * @param ctx The context to render into.
     * @param rect The world space rectangle to fill with hatching.
     */
    _drawHatchingInRect(ctx, rect) {
        const extents = this._getNormalizedExtentsInWorldUnits();
        for (let x = rect.left - rect.height; x <= rect.right; x += this._lpxToWorldUnits(4.0)) {
            if (x + rect.height > extents.left && x <= extents.right) {
                ctx.moveTo(x, rect.top);
                ctx.lineTo(x + rect.height, rect.bottom);
            }
            if (x > extents.right) {
                break;
            }
        }
        ctx.stroke();
    }
    /**
     * Returns the normalized world coordinates of the left edge of the canvas.  See the section on
     * normalization in the class documentation for more details.
     */
    _getCanvasLeftInNormalizedWorldUnits() {
        return this._worldOrigin.x;
    }
    /**
     * Returns the normalized world coordinates of the top edge of the canvas.  See the section on
     * normalization in the class documentation for more details.
     */
    _getCanvasTopInNormalizedWorldUnits() {
        return this._worldOrigin.y;
    }
    /**
     * Returns the true world coordinates of the left edge of the canvas.  See the section on
     * normalization in the class documentation for more details.
     */
    _getCanvasLeftInTrueWorldUnits() {
        return this._trueWorldOrigin.x;
    }
    /**
     * Returns the true world coordinates of the top edge of the canvas.  See the section on
     * normalization in the class documentation for more details.
     */
    _getCanvasTopInTrueWorldUnits() {
        return this._trueWorldOrigin.y;
    }
    /**
     * Returns the width of the canvas in world units.
     */
    _getCanvasWidthInWorldUnits() {
        return (1.0 / this._scaleFactor) * CANVAS_WIDTH_PX;
    }
    /**
     * Returns the height of the canvas in world units.
     */
    _getCanvasHeightInWorldUnits() {
        return (1.0 / this._scaleFactor) * CANVAS_HEIGHT_PX;
    }
    /**
     * Overwrites the transformation matrix on `ctx` with a default matrix based on the current scale
     * factor and normalized world origin.  This will be the matrix that translates normalized world
     * coordinates into screen space physical pixels based on the player's chosen viewport.
     * @param ctx The context on which to set the transformation matrix.
     */
    _setWorldSpaceTransform(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const extents = this._getNormalizedExtentsInWorldUnits();
        ctx.scale(window.devicePixelRatio * this._scaleFactor, window.devicePixelRatio * this._scaleFactor);
        ctx.translate(-extents.left, -extents.top);
    }
    /**
     * Overwrites the transformation matrix on `ctx` with a default matrix that maps from screen space
     * logical pixels to screen space physical pixels.  This will be the matrix that allows drawing to
     * the canvas directly in screen space.
     * @param ctx The context on which to set the transformation matrix.
     */
    _setScreenSpaceTransform(ctx) {
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    /**
     * Converts a screen space point in logical pixels into true world space coordinates.
     * @param x The x coordinate in logical pixels.
     * @param y The y coordinate in logical pixels.
     */
    _toTrueWorldCoordinates(x, y) {
        const extents = this._getTrueExtentsInWorldUnits();
        return new WorldPoint(extents.left + this._lpxToWorldUnits(x), extents.top + this._lpxToWorldUnits(y));
    }
    /**
     * Converts a screen space point in logical pixels into normalized world space coordinates.
     * @param x The x coordinate in logical pixels.
     * @param y The y coordinate in logical pixels.
     */
    _toNormalizedWorldCoordinates(x, y) {
        const extents = this._getNormalizedExtentsInWorldUnits();
        return new WorldPoint(extents.left + this._lpxToWorldUnits(x), extents.top + this._lpxToWorldUnits(y));
    }
    /**
     * Converts a normalized world space point in world units into a screen space point in logical
     * pixels.
     * @param x The x coordinate in normalized world units.
     * @param y The y coordinate in normalized world units.
     */
    _fromNormalizedWorldCoordinates(x, y) {
        const extents = this._getNormalizedExtentsInWorldUnits();
        return new DOMPoint(this._worldUnitsToLpx(x - extents.left), this._worldUnitsToLpx(y - extents.top));
    }
    /**
     * Converts a one-dimensional distance in world units into a distance in physical pixels.
     * @param worldUnits The distance to convert.
     */
    _worldUnitsToPpx(worldUnits) {
        return worldUnits * this._scaleFactor * window.devicePixelRatio;
    }
    /**
     * Converts a one-dimensional distance in physical pixels into a distance in world units.
     * @param worldUnits The distance to convert.
     */
    _ppxToWorldUnits(ppx) {
        return ppx / (this._scaleFactor * window.devicePixelRatio);
    }
    /**
     * Converts a one-dimensional distance in world units into a distance in logical pixels.
     * @param worldUnits The distance to convert.
     */
    _worldUnitsToLpx(worldUnits) {
        return worldUnits * this._scaleFactor;
    }
    /**
     * Converts a one-dimensional distance in logical pixels into a distance in world units.
     * @param worldUnits The distance to convert.
     */
    _lpxToWorldUnits(lpx) {
        return lpx / this._scaleFactor;
    }
    /**
     * Returns whether the given normalized world space rectangle at least partially intersects with
     * the current viewport.
     * @param x The normalized world space coordinate of the rectangle's left edge.
     * @param y The normalized world space coordinate of the rectangle's top edge.
     * @param width The width of the rectangle in world units.
     * @param height The height of the rectangle in world units.
     */
    _isOnscreen(rect) {
        const extents = this._getNormalizedExtentsInWorldUnits();
        return rect.left <= extents.right && rect.right >= extents.left &&
            rect.top <= extents.bottom && rect.bottom >= extents.top;
    }
    /**
     * Returns a rectangle giving the viewport extents in normalized world coordinates.
     */
    _getNormalizedExtentsInWorldUnits() {
        const rect = new WorldRect();
        rect.left = this._getCanvasLeftInNormalizedWorldUnits();
        rect.top = this._getCanvasTopInNormalizedWorldUnits();
        rect.right = rect.left + this._getCanvasWidthInWorldUnits();
        rect.bottom = rect.top + this._getCanvasHeightInWorldUnits();
        return rect;
    }
    /**
     * Returns a rectangle giving the viewport extents in true world coordinates.
     */
    _getTrueExtentsInWorldUnits() {
        const rect = new WorldRect();
        rect.left = this._getCanvasLeftInTrueWorldUnits();
        rect.top = this._getCanvasTopInTrueWorldUnits();
        rect.right = rect.left + this._getCanvasWidthInWorldUnits();
        rect.bottom = rect.top + this._getCanvasHeightInWorldUnits();
        return rect;
    }
    _setDebugText(text) {
        document.getElementById('debug').textContent = text;
    }
}
//# sourceMappingURL=renderer.js.map