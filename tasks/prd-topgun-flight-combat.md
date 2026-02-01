# PRD: Top Gun — 3D Arcade Flight Combat Game

## Introduction

A browser-based 3D arcade flight combat game built with Babylon.js and TypeScript. Players fly military aircraft across campaign theaters, engaging in dogfights, ground attacks, and carrier operations. The game targets casual browser gamers with accessible controls and short session gameplay, while offering enough depth through aircraft variety, mission types, and progression to keep players coming back.

The first playable milestone proves the full game structure end-to-end: fly an aircraft, fight enemies, complete a mission with briefing/debrief flow.

## Goals

- Deliver an engaging arcade flight combat experience playable in any modern browser
- Support casual players with intuitive keyboard controls and forgiving flight physics
- Provide a complete campaign arc across 4 theaters with 20-30 missions total
- Architect cleanly enough that multiplayer could be added in the future without a rewrite
- Ship with placeholder art initially; swap in real assets incrementally

## User Stories

### US-001: Project Bootstrap
**Description:** As a developer, I need a working Babylon.js + TypeScript project so that I have a foundation to build on.

**Acceptance Criteria:**
- [ ] Vite + TypeScript project initializes and runs with `npm run dev`
- [ ] Babylon.js scene renders with camera, light, and a ground plane
- [ ] A movable cube responds to keyboard input
- [ ] Typecheck and lint pass

### US-002: Arcade Flight Model
**Description:** As a player, I want to fly an aircraft that feels responsive and fun so that the core moment-to-moment gameplay is satisfying.

**Acceptance Criteria:**
- [ ] Aircraft entity with pitch, yaw, roll controls via keyboard (WASD + QE or arrow keys)
- [ ] Speed affects turn rate (faster = wider turns)
- [ ] Stall at low speed: nose drops automatically, speed recovers as aircraft dives. No player input required to recover.
- [ ] Altitude floor prevents flying underground
- [ ] Debug UI overlay to tweak flight parameters in real-time (sliders for speed, turn rate, etc.)
- [ ] Verify in browser: flight feels smooth and responsive at 60 FPS

### US-003: Camera System
**Description:** As a player, I want a smooth third-person camera that follows my aircraft so I can see where I'm going and what I'm fighting.

**Acceptance Criteria:**
- [ ] Camera follows behind and slightly above the aircraft
- [ ] Smooth interpolation — no snapping or jitter during turns
- [ ] Camera pulls back slightly at high speed, tightens at low speed
- [ ] Verify in browser: camera feels natural during aggressive maneuvering

### US-004: Terrain and Skybox
**Description:** As a player, I want to see ground and sky so the world feels real and I have spatial reference.

**Acceptance Criteria:**
- [ ] Ground plane or basic heightmap terrain with a texture
- [ ] Skybox with a sky/horizon/ground gradient
- [ ] Terrain is large enough that the player doesn't fly off the edge in normal gameplay
- [ ] Verify in browser: world feels expansive, no obvious seams

### US-005: Gun Combat
**Description:** As a player, I want to fire guns at enemy aircraft so that I can engage in dogfights.

**Acceptance Criteria:**
- [ ] Pressing fire key spawns bullet projectiles from the aircraft nose
- [ ] Projectiles travel forward at high speed and despawn after max range
- [ ] Projectiles have a visible tracer effect
- [ ] Rate of fire is limited (not continuous stream)
- [ ] Verify in browser: gun firing feels punchy with visible tracers

### US-006: Enemy Aircraft AI
**Description:** As a player, I want enemy aircraft that fly and fight so I have something to dogfight against.

**Acceptance Criteria:**
- [ ] Enemy aircraft entity spawns in the world and flies autonomously
- [ ] Basic AI: fly toward player, attempt to get behind player
- [ ] Enemy fires guns when player is in front and within range
- [ ] Enemy takes evasive action when being shot at (basic)
- [ ] Verify in browser: enemy provides a reasonable dogfight challenge

### US-007: Collision and Damage
**Description:** As a player, I want to see damage and destruction so combat has consequences.

**Acceptance Criteria:**
- [ ] Aircraft have a health value; bullets reduce health on hit
- [ ] Collision detection between projectiles and aircraft (bounding box or sphere)
- [ ] Aircraft destroyed at 0 health with explosion VFX (particle burst)
- [ ] Dramatic screen shake on hits (heavy for big hits, light for small hits)
- [ ] Ground collision destroys the player's aircraft
- [ ] Player death triggers mission failure
- [ ] Verify in browser: hits register reliably, explosions are visible and satisfying

### US-008: HUD
**Description:** As a player, I want a heads-up display showing flight and combat information so I can make tactical decisions.

**Acceptance Criteria:**
- [ ] Speed indicator (knots or arbitrary units)
- [ ] Altitude indicator
- [ ] Heading indicator (compass)
- [ ] Weapon status (ammo count or heat gauge)
- [ ] Health/damage indicator
- [ ] HUD renders in Babylon GUI, anchored to screen space
- [ ] Verify in browser: HUD is readable at a glance, doesn't obscure gameplay

### US-009: Targeting and Radar
**Description:** As a player, I want to identify and track enemies so I know where threats are.

**Acceptance Criteria:**
- [ ] 2D top-down radar minimap showing relative positions of enemies (used in early theaters)
- [ ] Target reticle highlights the currently selected enemy
- [ ] Lead indicator shows where to aim guns (deflection shooting aid)
- [ ] Cycle-target key to switch between enemies
- [ ] Radar upgrades to rotating sweep display (contacts fade) for futuristic aircraft in Arctic theater
- [ ] Verify in browser: radar and reticle make it easy to find and engage enemies

### US-010: Missile Lock-On
**Description:** As a player, I want to lock onto enemies and fire missiles for an alternative to guns.

**Acceptance Criteria:**
- [ ] Hold lock key while pointing near an enemy to begin lock-on (growing tone/visual)
- [ ] After lock-on completes, fire key launches a heat-seeking missile
- [ ] Missile tracks the locked target with limited turning ability
- [ ] Limited missile ammo per sortie
- [ ] Verify in browser: lock-on feels tense, missile tracking is visible

### US-011: Mission Definition and Loading
**Description:** As a developer, I need a data-driven mission system so missions can be defined in JSON without recompiling.

**Acceptance Criteria:**
- [ ] Mission JSON schema defines: theater, objectives, enemy spawns, player start position
- [ ] MissionLoader parses JSON and spawns entities accordingly
- [ ] ObjectiveManager tracks objective completion (e.g., "destroy 3 enemies")
- [ ] Mission ends when all objectives complete (success) or player dies (failure)
- [ ] At least one mission JSON file exists and loads correctly

### US-012: Mission Flow (Briefing → Flight → Debrief)
**Description:** As a player, I want a complete mission flow so each mission feels like a discrete experience.

**Acceptance Criteria:**
- [ ] Briefing scene shows mission name, description, objectives, and theater
- [ ] Player presses a key/button to launch into the mission
- [ ] On mission complete: transition to debrief scene showing results (kills, time, pass/fail)
- [ ] Debrief offers "next mission" or "return to menu"
- [ ] Scene transitions are clean (no flicker, loading state if needed)
- [ ] Verify in browser: full loop from briefing through debrief works end-to-end

### US-013: Aircraft Data and Variety
**Description:** As a player, I want to fly different aircraft with distinct characteristics so there's variety and progression.

**Acceptance Criteria:**
- [ ] aircraft.json defines at least 3 aircraft: F-14 Tomcat, P-51 Mustang, F/A-18 Super Hornet
- [ ] Each aircraft has distinct stats: max speed, turn rate, acceleration, weapon loadout
- [ ] Flight model reads stats from data — no hardcoded values per aircraft
- [ ] Stats differences are noticeable in gameplay (P-51 is slower but turns tighter, etc.)

### US-014: Hangar / Aircraft Selection
**Description:** As a player, I want to choose my aircraft before a mission so I can pick the right tool for the job.

**Acceptance Criteria:**
- [ ] Hangar scene displays available aircraft with stats
- [ ] Player selects an aircraft; selection carries into the next mission
- [ ] Locked aircraft shown but not selectable (grayed out)
- [ ] Verify in browser: hangar is navigable and stats are clear

### US-015: Progression and Unlocks
**Description:** As a player, I want to unlock new aircraft and missions by playing so I feel a sense of progression.

**Acceptance Criteria:**
- [ ] Completing missions awards a score/rating
- [ ] New aircraft unlock at campaign milestones (e.g., complete Pacific theater → unlock F/A-18)
- [ ] Missions unlock sequentially within each theater
- [ ] Progress persists via localStorage

### US-016: Advanced AI (Evasion and Formations)
**Description:** As a player, I want smarter enemies that fly in formations and evade effectively so combat stays challenging.

**Acceptance Criteria:**
- [ ] Enemies can fly in wing pairs or diamond formations
- [ ] Enemies break formation to engage, reform when disengaged
- [ ] Evasive maneuvers: barrel rolls, split-S, break turns when missiles incoming
- [ ] Difficulty scales across campaign (early enemies are dumber)

### US-017: Weapon Variety
**Description:** As a player, I want bombs, rockets, and different missile types so missions have tactical variety.

**Acceptance Criteria:**
- [ ] Heat-seeking missiles (AIM-9 type): lock required, good for dogfights
- [ ] Radar-guided missiles (AIM-120 type): longer range, fire-and-forget after lock
- [ ] Unguided rockets: burst fire, good against ground targets
- [ ] Bombs: drop on ground targets, gravity-affected trajectory
- [ ] Weapon loadout defined per aircraft in aircraft.json

### US-018: Countermeasures
**Description:** As a player, I want to deploy flares and chaff to defeat incoming missiles so I have defensive options.

**Acceptance Criteria:**
- [ ] Flare key deploys flares (limited supply)
- [ ] Flares have a chance to decoy heat-seeking missiles
- [ ] Chaff has a chance to break radar missile lock
- [ ] Visible flare/chaff particle effects behind aircraft
- [ ] Verify in browser: deploying countermeasures is visually clear

### US-019: Ground Targets and Air-to-Ground Missions
**Description:** As a player, I want to attack ground targets so there's more than just dogfighting.

**Acceptance Criteria:**
- [ ] Ground target entities: SAM sites, bunkers, vehicles, radar installations
- [ ] Ground targets can be destroyed with bombs, rockets, or guns
- [ ] SAM sites fire surface-to-air missiles at the player
- [ ] At least one air-to-ground mission exists in the campaign
- [ ] Verify in browser: ground attack gameplay loop works end-to-end

### US-020: Campaign Structure
**Description:** As a player, I want a multi-theater campaign so the game has a complete arc.

**Acceptance Criteria:**
- [ ] 4 theaters: Pacific, Middle East, Europe, Arctic
- [ ] 5-8 missions per theater (20-30 total)
- [ ] Menu scene with theater selection showing completion progress
- [ ] Pacific and Middle East available from start; completing either unlocks Europe; completing Europe unlocks Arctic
- [ ] Each theater has a distinct skybox/terrain palette

### US-021: Save System
**Description:** As a player, I want my progress saved so I can pick up where I left off.

**Acceptance Criteria:**
- [ ] SaveManager persists to localStorage: unlocked aircraft, completed missions, scores
- [ ] Save loads on game start, no manual save/load needed
- [ ] Handles missing/corrupt save gracefully (reset to defaults)

### US-022: Boss Encounters
**Description:** As a player, I want memorable boss fights at the end of each theater for climactic moments.

**Acceptance Criteria:**
- [ ] At least one boss per theater (4 total)
- [ ] Bosses have unique behavior (not just tougher enemies)
- [ ] Boss health bar visible on HUD
- [ ] Defeating boss triggers theater completion

### US-023: Scoring and Medals
**Description:** As a player, I want to be scored and earn medals so I'm motivated to replay missions.

**Acceptance Criteria:**
- [ ] Mission score based on: kills, accuracy, time, damage taken
- [ ] Medal thresholds: Bronze, Silver, Gold per mission
- [ ] Medals displayed on debrief and in mission select
- [ ] Best score persisted in save data

### US-024: Asset Replacement (Models, Audio, VFX)
**Description:** As a developer, I need to swap placeholder meshes for real aircraft models and add sound/VFX polish.

**Acceptance Criteria:**
- [ ] At least 3 aircraft have GLTF models (sourced from CGTrader/Sketchfab/TurboSquid or created)
- [ ] Engine sound loop per aircraft (pitch varies with throttle)
- [ ] Weapon SFX: gun fire, missile launch, explosions
- [ ] Music tracks per theater (ambient/combat)
- [ ] VFX: smoke trails on damaged aircraft, muzzle flash, missile exhaust, screen shake on hit

### US-025: Performance Optimization
**Description:** As a player, I want the game to run at 60 FPS on mid-range hardware so it's enjoyable to play.

**Acceptance Criteria:**
- [ ] Object pooling for projectiles and particle effects
- [ ] LOD on terrain and distant objects
- [ ] Frustum culling enabled
- [ ] Profiled with Chrome DevTools — no frame drops below 30 FPS with 20+ entities

### US-026: Carrier Operations
**Description:** As a player, I want to take off from and land on aircraft carriers for immersive naval aviation gameplay.

**Acceptance Criteria:**
- [ ] Carrier model in the ocean with a flight deck
- [ ] Catapult takeoff sequence (throttle up → launch)
- [ ] Landing approach with glideslope guidance (HUD AoA and lineup indicators)
- [ ] Arresting wire catch on successful landing
- [ ] Failed landing = bolter (go around) or crash
- [ ] Carrier quals mission in Pacific theater
- [ ] Verify in browser: takeoff and landing feel distinct and rewarding

### US-027: Arctic Theater and Futuristic Content
**Description:** As a player, I want the final campaign theater with futuristic aircraft and drone enemies for a climactic endgame.

**Acceptance Criteria:**
- [ ] Arctic terrain (snow/ice textures, cold palette skybox)
- [ ] Drone swarm enemy type (many weak enemies in coordinated groups)
- [ ] At least one futuristic/concept aircraft unlockable in this theater
- [ ] Final boss encounter
- [ ] Credits scene after final mission

### US-028: Tutorial Mission
**Description:** As a new player, I want a guided tutorial so I can learn the controls without reading a manual.

**Acceptance Criteria:**
- [ ] First mission in Pacific theater is a tutorial
- [ ] Step-by-step prompts: throttle, turn, shoot, lock-on, land
- [ ] Forgiving conditions (no enemies until combat tutorial step)
- [ ] Skippable for returning players

### US-029: Menu and UI Shell
**Description:** As a player, I want a main menu to navigate the game's features.

**Acceptance Criteria:**
- [ ] Main menu with: New Game, Continue, Settings
- [ ] Settings: audio volume, control rebinding (stretch), graphics quality toggle
- [ ] Theater/mission select screen
- [ ] HTML/CSS menus (not Babylon GUI) for layout flexibility
- [ ] Verify in browser: menu navigation is intuitive

## Functional Requirements

- FR-1: Render a Babylon.js 3D scene in a web browser with WebGL
- FR-2: Accept keyboard input for flight controls (pitch, yaw, roll, throttle)
- FR-3: Simulate arcade flight physics where speed affects turn rate and stall occurs at low speed
- FR-4: Render a third-person chase camera with smooth interpolation
- FR-5: Display terrain and skybox providing spatial reference
- FR-6: Fire gun projectiles with visible tracers and rate-of-fire limiting
- FR-7: Spawn AI-controlled enemy aircraft that pursue and engage the player
- FR-8: Detect collisions between projectiles and aircraft using bounding volumes
- FR-9: Apply damage on hit; destroy entities at zero health with explosion VFX
- FR-10: Display a HUD with speed, altitude, heading, weapon status, and health
- FR-11: Show a 2D radar minimap with relative enemy positions
- FR-12: Provide a targeting reticle with lead indicator for deflection shooting
- FR-13: Support missile lock-on with audio/visual feedback and homing projectiles
- FR-14: Load mission definitions from JSON files (objectives, spawns, positions)
- FR-15: Track mission objectives and trigger success/failure conditions
- FR-16: Transition between scenes: menu → briefing → mission → debrief
- FR-17: Define aircraft stats in JSON; flight model reads stats at runtime
- FR-18: Present a hangar scene for aircraft selection with visible stats
- FR-19: Unlock aircraft and missions based on campaign progression
- FR-20: Persist player progress to localStorage
- FR-21: Support bombs, rockets, heat-seekers, and radar missiles with distinct behaviors
- FR-22: Deploy flares/chaff countermeasures to defeat incoming missiles
- FR-23: Render destructible ground targets (SAM sites, bunkers, vehicles)
- FR-24: Structure campaign as 4 sequential theaters with 5-8 missions each
- FR-25: Score missions and award Bronze/Silver/Gold medals
- FR-26: Simulate carrier takeoff (catapult) and landing (arresting wire)
- FR-27: Maintain 60 FPS on mid-range hardware with 20+ active entities
- FR-28: Architect entity and networking layers to allow future multiplayer addition

## Non-Goals

- No multiplayer in this version (but architecture should not preclude it)
- No mobile-native app — browser only
- No procedural mission generation — all missions are hand-authored JSON
- No realistic flight simulation — this is arcade-first
- No microtransactions or monetization system
- No gamepad support in the initial release (keyboard only first, gamepad added later)
- No VR/AR support
- No level editor or modding tools

## Design Considerations

- **HUD**: Built with Babylon GUI (AdvancedDynamicTexture) so it integrates with the 3D scene. Keep it minimal — Top Gun movie aesthetic with clean lines and contrasting colors.
- **Menus**: HTML/CSS overlaid on the canvas. Easier to layout, style, and animate than in-engine GUI.
- **Placeholder art**: All entities start as colored geometric primitives (boxes, cones, cylinders). Asset swap should require only changing the mesh reference, not the entity logic.
- **Color coding**: Player = blue tones, enemies = red tones, ground targets = orange, friendlies = green. Consistent across HUD, radar, and world.

## Technical Considerations

- **Babylon.js 7.x**: Primary rendering and scene management. Use built-in particle system for VFX, spatial audio for engine/weapon sounds.
- **Vite 5.x**: Dev server with HMR for fast iteration. Production builds with tree-shaking.
- **No physics engine for flight**: Custom `FlightSystem` with tunable curves. Babylon's physics only used if needed for debris/ragdoll effects.
- **Entity architecture**: Simple class hierarchy (Entity → Aircraft, Projectile, GroundTarget). Each entity owns its Babylon mesh. Systems operate on entity arrays. Not a full ECS — unnecessary for the entity count.
- **Future multiplayer readiness**: Keep game state updates in discrete systems (FlightSystem, WeaponSystem, etc.) that could be driven by network state instead of local input. Don't bake input handling into entity classes. Use an InputManager abstraction.
- **Asset loading**: Babylon's `AssetsManager` for batched loading with progress bar. GLTF format for models.
- **Save format**: JSON in localStorage under a versioned key. Include a schema version for migration.

## Success Metrics

- Player can complete a full mission loop (menu → briefing → fly → fight → debrief) within 10 minutes of first launch
- Flight controls feel responsive — less than 100ms input-to-visual-response latency
- 60 FPS sustained on a 2020-era laptop (integrated GPU) with 20 entities
- At least 20 missions playable from start to credits
- Casual playtesters can complete the tutorial without external instructions

## Design Decisions (Resolved)

- **Stall behavior**: Nose-drop + auto-recover. Aircraft nose dips, speed builds back naturally. Forgiving and arcade-friendly.
- **Radar display**: Starts as a simple top-down minimap in early theaters. Upgrades to a rotating sweep display (contacts fade over time) for futuristic aircraft in later theaters.
- **Aircraft stat spread**: Wide. Aircraft should feel very different from each other. P-51 is slow/agile, F-22 is fast/stiff. Forces playstyle adaptation per mission.
- **Theater progression**: Parallel unlock. First 2 theaters (Pacific, Middle East) available from the start. Completing either unlocks the next. Player has freedom to choose.
- **Asset licensing**: Budget available for paid models and audio from CGTrader, Sketchfab, TurboSquid, etc. Not limited to free/CC0.
- **Screen shake**: Dramatic. Heavy shake on big hits, light shake on small hits. Lean into the arcade juice.

## Open Questions

None — all resolved.
