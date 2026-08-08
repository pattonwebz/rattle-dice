# Dice Systems Research — Non-D&D / Non-Warhammer TTRPGs
Research for a web-based dice roller app. Compiled from official SRDs, publisher wikis, and community dice tools.

---

## 1. Per-System Summary

### Call of Cthulhu 7th Edition (Chaosium) — d100 / percentile
- **Dice:** 1d100 (two d10s: tens + ones, 01–100); damage/other rolls use d4, d6, d8, d10, d20 as needed.
- **Resolution:** Roll-under skill/characteristic. Roll ≤ skill = **Regular success**; ≤ half = **Hard success**; ≤ one-fifth = **Extreme success**. Roll > skill = failure; 96–100 (or 100 if skill > 50%) = **Fumble**; roll of 01 = **Critical success** (automatic best result). A critical beats extreme beats hard beats regular beats failure. Opposed rolls: highest degree of success wins; ties favor the defender.
- **Special rules:** **Bonus/Penalty dice** — roll an extra tens die and take the lower (bonus) or higher (penalty) tens digit; dice stack. **Pushing rolls** — a failed skill/characteristic roll may be re-rolled once if justified, but failing the pushed roll triggers a dire Keeper consequence. Luck, Sanity, combat, and damage rolls cannot be pushed. **Luck spend** 1-for-1 to adjust a roll (not on luck/sanity/damage rolls; cannot be combined with a push).
- **App note:** needs two-die d100 semantics, half/one-fifth thresholds, bonus/penalty dice handling (roll extra d10, pick high/low tens digit), push-roll workflow.

### World of Darkness / Vampire: The Masquerade — d10 pools
- **Dice:** pools of d10s (Attribute + Skill; V5 adds Hunger dice).
- **Resolution (classic Storyteller, V20):** each die ≥ difficulty (default 6 in Revised/V20) = 1 success; 1s cancel successes; a "10 again" (on a 10, reroll and add) in Revised; botch if no successes remain after cancellations. Difficulty typically 6, range 3–10.
- **Resolution (V5):** no difficulty number; each die showing 6–10 = 1 success; count successes vs. a required number set by the Storyteller (1 = trivial … 5+ = nearly impossible). **Critical:** if the roll has at least two 10s, it succeeds with +2 extra successes per pair of 10s (and 10s also count as successes).
- **Special rules (V5):** **Hunger dice** (max 5) replace normal dice at high Hunger and cannot be re-rolled by Willpower. A **10 on a hunger die** during a winning roll = **Messy Critical** (success, but the Beast takes over). A **1 on a hunger die** when the roll fails = **Bestial Failure** (a fumble-like outcome). **Willpower** re-rolls up to 3 failed normal dice (never hunger dice). Hunger itself is a track: fail a roll → +1 Hunger.
- **App note:** success-counting vs. difficulty (V20) and vs. fixed threshold (V5); pair-of-10s criticals; hunger-die color coding; messy/bestial flags; willpower reroll interaction.

### FATE / Fudge — Fudge dice (dF)
- **Dice:** 4dF ("four Fudge dice"), d6 marked with 2× "+", 2× "−", 2× blank (i.e., a d3 in −1/0/+1); sum = −4 to +4. A standard d6 with 1–2 = −, 3–4 = 0, 5–6 = + is the official substitute.
- **Resolution:** roll 4dF, add skill/approach rating, compare to a target (usually a **FATE Ladder** rank: −2 Terrible … +0 Mediocre … +3 Great … +8 Legendary, etc.). Result = ladder value; **Shifts** = how far the result beats the difficulty (the margin/degrees of success).
- **Special rules:** 4dF produces a steep bell curve centered on 0 (2/3 of rolls are −1/0/+1). **Fate Points** are spent for rerolls/boosts, invoking aspects, and stunts — rerolls happen after seeing the roll. Some variants use 2d6 or "dF.2" scaling; success with style at +3 or more over the difficulty.
- **App note:** trinary-face die (−1/0/+1), summing, ladder mapping, shift/margin display.

### Savage Worlds (Pinnacle, SWADE) — stepped dice d4–d12 with exploding aces
- **Dice:** trait dice d4/d6/d8/d10/d12; **Wild Die** = extra d6 for "Wild Cards" (PCs); damage dice any size (d4–d12+, often d6s).
- **Resolution:** roll trait die (+ Wild Die, take the higher), **Target Number (TN) 4** for most rolls; modifiers (easy +2, difficult −2, very difficult −4, etc.). Success = total ≥ TN; every full 4 points over TN = a **Raise** (degrees of success).
- **Special rules:** **Acing** — a die showing its maximum value "explodes": roll again and add, indefinitely. Unskilled attempts roll d4−2 (still with Wild Die). Opposed rolls: highest total wins, opponent's total is the TN for raises. **Bennies** — spend to re-roll any trait/damage roll (fresh roll, best result kept), to remove Shaken, or for a Soak roll (Vigor vs. damage, success/raises cancel wounds). Critical failures = natural 1 on both trait die and Wild Die (double 1s), cannot be benny-rerolled. Damage: ranged = fixed, melee = weapon + Strength die, damage dice ace; a raise on the attack adds +1d6 damage (which can ace). Wounds on damage = 4+ over Toughness.
- **App note:** exploding dice (recursive max-reroll), best-of-(trait, wild die), TN 4 + raise counting (every 4), benny reroll flow, wound/soak math.

### Star Wars FFG / Genesys — custom narrative dice
- **Dice:** seven custom dice — Boost (blue d6), Ability (green d8), Proficiency (yellow d12) on the positive side; Setback (black d6), Difficulty (purple d8), Challenge (red d12) on the negative side; Force die (white d12). Genesys uses the same six non-Force dice (with a slightly different symbol set for boost/setback at high rolls) plus its own names; the face distributions below are shared.
- **Resolution:** build a pool of positive dice (Ability/Proficiency per skill/attribute, Boost for favorable circumstances) vs. negative dice (Difficulty for task difficulty, Setback for unfavorable circumstances, upgrades turn Ability→Proficiency and Difficulty→Challenge). Roll, then **cancel symbol-for-symbol**: Success cancels Failure, Advantage cancels Threat; **Triumph and Despair never cancel** (each also counts as one Success/Failure respectively). Net Success ≥ 1 = success; net Advantage = beneficial narrative detail; net Threat = complication; Triumph/Despair = dramatic critical-ish effects. **Upgrades** (Ability→Proficiency, Difficulty→Challenge) are the core "improve odds" mechanic; **add/remove dice** adjusts difficulty.
- **Special rules:** two-axis resolution (success/failure AND advantage/threat); Triumph/Despair are uncancellable; Force dice are used for Force powers and Destiny Point generation — no blank faces, equal total light/dark pips but more dark faces ("the dark side is faster, easier").
- **App note:** needs custom dice tables (below), automatic cancellation, net-symbol tally output, upgrade/downgrade pool editor.

### Legend of the Five Rings 5e (FFG/Edge) — custom d6 + d12 symbol dice
- **Dice:** black **Ring dice** (d6) + white **Skill dice** (d12); roll (Ring + Skill), then **keep** up to your Ring rating dice (choose which results to keep; at least 1).
- **Resolution:** count **Success** symbols among kept dice; total ≥ TN (target number, typically 1–7+) = success. TN set by the GM per check difficulty.
- **Special rules:** **Explosive Success** — counts as a success AND lets you roll 1 extra die of the same type (ring or skill, as rolled) and keep or drop its result (repeatable). **Opportunity** — spent as a narrative currency to add story details/effects (never affects pass/fail). **Strife** — each Strife symbol adds 1 strife; if Strife > Composure the character is **Compromised** and cannot keep dice showing Strife until they recover (unmasking, end-of-scene −1 strife, etc.). Strife only appears attached to other symbols. **Tenacity/void** (meta) allow rerolls or extra kept dice in some circumstances (GM-dependent).
- **App note:** needs dice-face tables (below), keep-N-selection UI, explosive re-rolls, success-vs-TN tally, opportunity counter, strife counter + composure check.

### Blades in the Dark (John Harper) — d6 pools, position/effect
- **Dice:** pool of d6s (action rating dots + up to 2 bonus dice). Zero dice: roll 2d6 take the lowest.
- **Resolution:** read the **single highest die**. 6 = full success; more than one 6 = **critical** (increased effect); 4–5 = **partial success** (do it, with a consequence); 1–3 = bad outcome (complication/harm/lost opportunity).
- **Special rules:** **Position** (controlled / risky / desperate) sets consequence severity; **Effect level** (limited / standard / great) sets how much the action accomplishes; **bonus dice** via Assistance (+1d, ally takes 1 stress), Push Yourself (+1d, take 2 stress), or a **Devil's Bargain** (+1d, accept a GM-offered complication — only one of push/bargain per roll); **Resistance rolls** spend stress to reduce a consequence (d6 pool vs. severity, stress cost by result). Zero-dice rolls (2d6-lowest) can't crit.
- **App note:** highest-die logic (not summing), multi-6 critical detection, zero-dice fallback (2d6 take lowest), position/effect annotation, resistance roll mode.

### Mothership (1e, Tuesday Knight Games) — d100, d10, d100 stress
- **Dice:** d100 (2d10 as tens/ones) for skill checks; **d10** for various tables; **d100** for stress/panic (the "Panic Die"); d6/d10 for damage etc.
- **Resolution:** **skill check** = roll d100 **under or equal** to skill/attribute = success. **Saves** similarly roll-under vs. a save stat. **Doubles** (11, 22, 33 …) under the skill = **critical success**; doubles over = **critical failure**; a 90+ roll is also a critical failure.
- **Special rules:** **Stress & Panic** — stress accumulates (typically +1 to +2 per frightening event, usually shown on a d10 track); when triggered, roll the **Panic Die (d100)**; if you roll **under or equal to your current stress** you fail and consult the **Panic Table** (severity scales with how far under you rolled). **Panic Table** = 2d10 + stress vs. table entries (trembling → heart attack). **Advantage/Disadvantage** — with advantage roll two tens dice, take the lower (better for roll-under); disadvantage takes the higher.
- **App note:** roll-under d100, doubles-based crit detection, stress-track awareness, panic check (d100 vs. stress + panic table lookup), adv/disadv tens-die logic.

### Cyberpunk RED (R. Talsorian) — d10 + d6
- **Dice:** 1d10 for all checks; d6 pools for damage; some weapons/effects use other polyhedrals.
- **Resolution:** roll 1d10, **add Stat + Skill** (+ modifiers), compare to a **Difficulty Value (DV)** set by the GM or by the weapon/effect table. Beat DV = success.
- **Special rules:** **Critical success (natural 10)** — the d10 explodes: roll another d10 and add; repeat on further 10s. **Fumble (natural 1)** — roll another d10 and subtract; repeat on further 1s (can go negative). **Luck** — spend Luck points to add to a roll result. Damage = weapon dice (+ attacker's skill/role bonuses in some cases); autofire uses the DV multiplier for shots on target.
- **App note:** d10 + stat/skill + mod vs DV, exploding 10 / anti-exploding 1, luck-spend modifier, damage dice.

### Ironsworn (Shawn Tomkin) — d6 + 2d10 challenge dice
- **Dice:** 1d6 **Action Die** + 2d10 **Challenge Dice**.
- **Resolution:** action score = d6 + stat (Edge/Heart/Iron/Shadow/Wits, max effectively 10). Compare vs. both challenge dice, **ties do not count** (must strictly exceed): beat both = **Strong Hit**; beat one = **Weak Hit**; beat none = **Miss**.
- **Special rules:** **Momentum** — a resource (−6 to +10) that can be **burned** to replace challenge dice you beat (set momentum to reset, default +2), or (Starforged) replace the action die. **Matches** — rolling matching challenge dice adds a narrative twist on strong hits/misses (Ask the Oracle / Pay the Price triggers). **Progress tracks** use the progress score instead of the action die (no d6 rolled) for progress moves. The d10 "10" can never be beaten (max action score 10).
- **App note:** 1d6+mod vs two d10s, tie = not-beaten logic, strong/weak/miss classification, match detection, momentum burn simulator.

### Kids on Bikes (Renegade) — stepped dice d4–d20, shared d6 pool
- **Dice:** each of 6 stats (Brains, Brawn, Fight, Flight, Charm, Grit) is assigned one die from d4/d6/d8/d10/d12/d20; one d20 is the "main" die per character.
- **Resolution:** roll the stat die vs. a GM-set **difficulty** (higher is better). **Snap decisions** (roll on the spot) vs. **planned actions** (take half the die value automatically). Difficulty 9 or lower can be auto-succeeded with the "Skilled At" strength; a **Knack** (2e) lets you take a 10. Combat/contested: both roll, higher wins, the winner narrates the outcome; **reroll ties**.
- **Special rules:** **Lucky Break** — rolling the die's maximum (4 on d4, 20 on d20) rerolls and adds, repeatedly (exploding). **Adversity Tokens (AT)** — start 3; each failure grants 1 (+1 if narrating a Flaw); spend any number after a roll for +1 each (also spendable to help allies); powers rerolls, strengths, etc. **Tiered checks** (no failure possible; result determines quality). Fears impose −1 to −3 when relevant. Age brackets give +1 bonuses to different stats.
- **App note:** stepped dice, difficulty compare, exploding-on-max, AT economy, planned vs snap decision modes, "take 10 / take half" rules.

### Other notable systems (brief, for completeness)

- **Year Zero Engine (Free League: Mutant: Year Zero, Forbidden Lands, Alien, Vaesen, Coriolis):** d6 pools of color-coded Base/Skill/Gear dice; **each 6 = 1 success**; 1s on base/gear dice damage the attribute/gear when pushing. **Push** — reroll all non-6 (and non-1 for base/gear) dice, once. *Alien* adds **Stress dice**: push adds a stress die, any stress 1 triggers a **Panic Roll** (1d6 + stress, 10+ = panic action). Success thresholds: usually 1+ success (Forbidden Lands) or "match a number of successes" (Mutant: Year Zero).
- **Modiphius 2d20 (Star Trek Adventures, Dune, Fallout, Conan):** roll **2d20** (base), each die ≤ target number (attribute + skill + focus, usually 8–20) = 1 success; Difficulty = required successes. **1s are critical successes** (2 extra successes, reroll); **20s are Complications** (spend Momentum/Threat to avoid, otherwise add +1 to threat pool). **Momentum** (players, from extra successes, spend to add d20s/buy effects) and **Threat** (GM pool) form the meta-economy. Effect dice (d6) add damage on combat hits.
- **Powered by the Apocalypse (Apocalypse World & hacks):** roll **2d6 + stat modifier** (−3 to +3); **10+ = full success**, **7–9 = partial success**, **6− = miss** (the MC makes a hard move). Advanced moves may shift bands (e.g., 12+ or 13+ exceptional hits in some hacks). No target numbers beyond the bands; no exploding dice.
- **Shadowrun (6e):** d6 pool (Attribute + Skill); **5s and 6s = hits**; meet or beat a threshold. **Glitch** — half or more of the dice show 1s (critical glitch if also no hits). **Edge** — spend to reroll failures, add dice, or make 6s explode.
- **Daggerheart (Darrington Press):** **Duality Dice** — two d12s (Hope die and Fear die), sum + trait modifier vs. a **Difficulty** (usually 10–14, or target's Evasion for attacks). **Critical success** on matching dice (auto-succeed, +bonus, clear stress; damage dice maxed on attacks). The **higher of the two d12s** determines Hope vs. Fear: Hope die higher → player gains a Hope token; Fear die higher → GM gains a Fear token (and worse consequences on failure). **Advantage/Disadvantage** — add/subtract a d6. Hope (max 6, player meta-currency) and Fear (max 12, GM meta-currency).
- **GUMSHOE (Trail of Cthulhu, Night's Black Agents):** Investigative abilities auto-succeed (spend pool points for extra detail); **general abilities** roll 1d6 and add the rating vs. a difficulty (2–8); spend points for +1 each. Margin = how much over the target.
- **Cypher System (Monte Cook):** d20 roll, add stat pool Edge/Effort vs. GM-set difficulty (1–10) × 3 as target (TN = difficulty×3); a natural 19 is a minor effect, natural 20 a major effect (or GM intrusion).
- **Forbidden Lands / Dragonbane (Free League stepped dice):** skill dice pool of stepped d6→d12 where successes are 6s on d6s / 10-12 on d10s / 12 on d12s; pushed rerolls on 1s.
- **Mothership-adjacent / OSR-style (e.g., Mörk Borg):** d20 roll-over with crits on natural 20 (and 1s = fumbles), plus d6/d10 damage — essentially d20-adjacent but worth flagging because the crit/fumble ranges vary by OSR game.

---

## 2. Symbol Dice — Exact Face Distributions

### 2a. Star Wars FFG / Genesys narrative dice
(Each die is a regular polyhedron with symbols printed on faces; "blank" faces carry no symbol.)

**Boost die (blue, d6)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | blank |
| 3 | 1 Success |
| 4 | 1 Success, 1 Advantage |
| 5 | 2 Advantages |
| 6 | 1 Advantage |

**Setback die (black, d6)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | blank |
| 3 | 1 Failure |
| 4 | 1 Failure |
| 5 | 1 Threat |
| 6 | 1 Threat |

**Ability die (green, d8)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | 1 Success |
| 3 | 1 Success |
| 4 | 2 Successes |
| 5 | 1 Advantage |
| 6 | 1 Advantage |
| 7 | 1 Success, 1 Advantage |
| 8 | 2 Advantages |

**Difficulty die (purple, d8)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | 1 Failure |
| 3 | 2 Failures |
| 4 | 1 Threat |
| 5 | 1 Threat |
| 6 | 1 Threat |
| 7 | 2 Threats |
| 8 | 1 Failure, 1 Threat |

**Proficiency die (yellow, d12)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | 1 Success |
| 3 | 1 Success |
| 4 | 2 Successes |
| 5 | 2 Successes |
| 6 | 1 Advantage |
| 7 | 1 Success, 1 Advantage |
| 8 | 1 Success, 1 Advantage |
| 9 | 1 Success, 1 Advantage |
| 10 | 2 Advantages |
| 11 | 2 Advantages |
| 12 | **1 Triumph** |

**Challenge die (red, d12)**
| Face | Result |
|---|---|
| 1 | blank |
| 2 | 1 Failure |
| 3 | 1 Failure |
| 4 | 2 Failures |
| 5 | 2 Failures |
| 6 | 1 Threat |
| 7 | 1 Threat |
| 8 | 1 Failure, 1 Threat |
| 9 | 1 Failure, 1 Threat |
| 10 | 2 Threats |
| 11 | 2 Threats |
| 12 | **1 Despair** |

**Force die (white, d12)** — no blank faces:
| Face | Result |
|---|---|
| 1–6 | 1 Dark Side point each |
| 7 | 2 Dark Side points |
| 8–9 | 1 Light Side point each |
| 10–12 | 2 Light Side points each |

Totals: 8 dark pips, 8 light pips (equal power), but 7 of 12 faces are dark vs. 5 light ("the dark side is faster, easier").

**Cancellation rules:** Success ↔ Failure cancel 1-for-1; Advantage ↔ Threat cancel 1-for-1. **Triumph and Despair never cancel**; each also acts as +1 Success / +1 Failure respectively. Net result read as: 0+ Success = success; remaining Advantage = narrative boon; remaining Threat = complication; Triumph/Despair = special dramatic effects. Force points are tracked separately (for Destiny Points / Force powers) and never cancel.

### 2b. Legend of the Five Rings 5e — Ring dice (d6) & Skill dice (d12)
**Ring die (black, d6)**
| Die face (roll) | Symbols |
|---|---|
| 1 | blank |
| 2 | 1 Opportunity, 1 Strife |
| 3 | 1 Opportunity |
| 4 | 1 Success, 1 Strife |
| 5 | 1 Success |
| 6 | 1 Explosive Success, 1 Strife |

**Skill die (white, d12)**
| Die face (roll) | Symbols |
|---|---|
| 1 | blank |
| 2 | blank |
| 3 | 1 Opportunity |
| 4 | 1 Opportunity |
| 5 | 1 Opportunity |
| 6 | 1 Success, 1 Strife |
| 7 | 1 Success, 1 Strife |
| 8 | 1 Success |
| 9 | 1 Success |
| 10 | 1 Success, 1 Opportunity |
| 11 | 1 Explosive Success, 1 Strife |
| 12 | 1 Explosive Success |

Notes: **Strife never appears alone** — it is always attached to a Success, Explosive Success, or Opportunity. Explosive Success counts as a Success and triggers an extra die of the same type (roll + keep or drop). Opportunity is a separate meta-currency. Ring dice are heavier on opportunity; skill dice on success.

### 2c. Fudge dice (dF) — used in FATE and Fudge
A d6 with **2 faces +, 2 faces −, 2 faces blank** (0). Values: +1, −1, 0. Standard 4dF roll sums to −4…+4 with a sharp bell curve: P(0)≈33.3%… actually the exact 4dF distribution is 1/81 each for ±4, 4/81 for ±3, 10/81 for ±2, 16/81 for ±1, 19/81 for 0. Using a normal d6: 1–2 = −, 3–4 = 0, 5–6 = +.

---

## 3. Recommended Feature List for a "support everything" dice app (ranked by generalization)

1. **Custom die-face definitions (symbol dice engine).** The single biggest differentiator: allow any die to be defined as a list of faces, each face carrying any combination of tokens (numeric value and/or named symbols like Success, Advantage, Strife). This one feature covers FFG Star Wars, Genesys, L5R, Fudge, and any future custom-dice game. Support distinct color/name per die type.
2. **Token aggregation & automatic cancellation.** Tally each symbol type across the pool; apply pairwise cancellation rules (configurable: Success/Failure, Advantage/Threat, plus "uncancellable" tokens like Triumph/Despair). Output the net result per axis. This is the core "read the roll" behavior for narrative systems and generalizes to any opposing-token system.
3. **Success-counting with thresholds (pool systems).** Count dice meeting a condition (≥ difficulty value, ≥ threshold like 5+/6+ in Shadowrun, 6 = success in YZE, 10s-pair criticals in V5) and compare to a required number. Applies to VtM (both classic difficulty and V5), Shadowrun, YZE, Old WoD.
4. **Exploding / recursive reroll on max (or on a specific face).** With per-die configuration: which faces explode (Savage Worlds max value; Cyberpunk RED 10s; Kids on Bikes max; L5R Explosive Success triggers an extra die; BitD n/a). Support both "reroll and add" (numeric) and "roll an extra die and keep/drop" (L5R).
5. **Keep / drop selection (k-N) with manual override.** Roll X keep Y (L5R: keep up to Ring rating, choose which), plus the common "keep highest / drop lowest" modifiers. Manual selection UI after the roll for L5R-style picks.
6. **Multiple resolution modes as pluggable "interpreters":** roll-over vs. TN (Cyberpunk RED, Daggerheart, KoB), roll-under vs. skill (CoC, Mothership), highest-die lookup (BitD), beat-both-challenge-dice (Ironsworn), sum-and-compare-to-ladder (FATE), threshold success-counting (pools). Each interpreter is small and reusable.
7. **Degrees of success / margin display.** Raises every 4 over TN (Savage Worlds), shifts (FATE), extra successes (V5), hard/extreme thresholds (CoC), net success count (FFG). Generalizes as "result banding" — configurable bands per system.
8. **Modifiers & advantage/disadvantage.** Flat ±modifiers, bonus/penalty dice with pick-low/high tens digit (CoC, Mothership), d6 advantage/disadvantage dice (Daggerheart), pool bonus dice (BitD assistance/push/bargain). 
9. **Meta-currency & tracking integrations:** Bennies/Fate Points/Hope & Fear/Momentum & Threat/Edge/Adversity Tokens/Stress (Mothership panic, Daggerheart stress, BitD stress) — lightweight counters tied to the roll UI rather than full character sheets.
10. **Roll history & shareable results** (render result text like "2 Success, 1 Advantage" or "4 raises"), plus probability helpers (odds per pool) as a later phase.
11. **Push / reroll workflows:** CoC pushed rolls (with consequence flag), YZE push, KoB AT spending, WoD Willpower rerolls — model as "re-roll a subset / whole pool" operations with configurable which-dice-reroll.
12. **Random-table lookups** (Mothership panic table, FATE ladder, KoB tiered checks) as optional post-roll output.

### Rationale for ordering
The custom-face engine (#1) plus token aggregation (#2) is the highest-leverage piece — it makes the three hardest systems (FFG, L5R, Fudge) tractable with one data model. Success-counting pools (#3) and exploding dice (#4) cover the majority of the classic systems. Keep/drop (#5) and pluggable interpreters (#6) then let you bolt on every remaining system with small configs rather than bespoke code. The rest are quality-of-life layers that generalize across all of them.

---

## 4. Support Matrix — System → What the App Must Implement

| System | Dice to implement | Core resolution | Mandatory mechanics to implement |
|---|---|---|---|
| **Call of Cthulhu 7e** | d100 (2d10 tens/ones), d4/d6/d8/d10/d20 | Roll-under skill; degrees (regular/hard=½/extreme=⅕); crit 01, fumble 96–100 (or 100 if skill>50) | Bonus/penalty dice (extra tens die, pick low/high), pushed rolls, Luck spend, opposed-roll degree comparison |
| **VtM V5 / WoD** | d10 pool (+ hunger dice) | 6–10 = success (V5); difficulty-based (V20) | Critical = 2×10s (+2 successes/pair), messy critical (hunger 10), bestial failure (hunger 1), willpower reroll (no hunger dice), 1s cancel successes (V20), 10-again (V20) |
| **FATE / Fudge** | 4dF (d6: 2+/2−/2 blank) | Sum 4dF + skill vs. ladder value; shifts = margin | Ladder mapping, shift/margin display, Fate-point reroll |
| **Savage Worlds (SWADE)** | d4–d12 trait die + d6 Wild Die | Roll vs TN 4; raises every 4 over | Exploding aces (max reroll+add), best-of trait/wild, unskilled d4−2, bennies (reroll/soak), double-1s crit fail, damage acing |
| **Star Wars FFG / Genesys** | 7 custom dice (boost/ability/proficiency/setback/difficulty/challenge/force) | Net Success after cancellation ≥1 = success | Symbol tally, Success↔Failure & Advantage↔Threat cancellation, Triumph/Despair uncancellable, upgrades (A→P, D→C), force pip counting |
| **L5R 5e** | Ring d6 + Skill d12 (custom faces) | Kept Successes + Explosive Successes ≥ TN | Keep-up-to-Ring selection, explosive success extra-die reroll, opportunity count, strife count + composure/compromised, TN comparison |
| **Blades in the Dark** | d6 pool (action rating + bonus) | Highest die: 6 full / 4–5 partial / 1–3 bad; 2×6 critical | Zero-dice → 2d6-lowest (no crit), position/effect labels, bonus dice (assist/push/devil's bargain), resistance rolls |
| **Mothership 1e** | d100 (2d10), d10 stress track, d100 panic die | Roll-under skill; doubles = crit success/fail; 90+ = crit fail | Panic check (d100 ≤ stress → panic table), adv/disadv (two tens dice pick low/high), stress tracking |
| **Cyberpunk RED** | 1d10 + d6 damage | d10 + Stat + Skill vs. DV | Exploding 10 (add), anti-exploding 1 (subtract), Luck spend, autofire |
| **Ironsworn** | 1d6 + 2d10 | Action score (d6+stat) vs. both d10s: strong/weak/miss (ties don't count) | Match detection (twists), momentum burn (replace beaten challenge dice / set reset value), progress-track rolls (no d6), max-score-10 rule |
| **Kids on Bikes** | d4–d20 stepped stats, d6 pool (adversity) | Stat die vs. difficulty; contested = higher wins, reroll ties | Lucky Break (max-value explosion), AT (fail = +1, spend for +1 each), planned actions (half die), knacks (take 10), tiered checks |
| **Year Zero Engine** | d6 pools (base/skill/gear/stress) | Each 6 = success vs. threshold | Push (reroll non-6s; non-1s for base/gear), 1s damage attribute/gear, Alien stress panic (1d6+stress ≥10 = panic action) |
| **2d20 (Modiphius)** | 2d20 + d6 effect dice | Each d20 ≤ target = success; Difficulty = required successes | 1s = crit (extra successes + reroll), 20s = complication, Momentum/Threat pools, buying extra d20s |
| **PbtA** | 2d6 + mod | 10+ full / 7–9 partial / 6− miss | Band comparison, optional advanced bands (12+/13+) |
| **Shadowrun 6e** | d6 pool | 5–6 = hit vs. threshold | Glitch (≥½ dice are 1s), critical glitch (glitch + no hits), Edge (reroll/add dice/explode 6s) |
| **Daggerheart** | 2d12 (Hope + Fear) + d6 adv/dis | Sum + mod vs. Difficulty | Match = critical (auto-success + damage max), higher-die determines Hope (player token) vs. Fear (GM token), Hope/Fear currency, stress on failure with fear |
| **GUMSHOE** | 1d6 + rating | Roll + rating vs. difficulty (2–8) | Point spending for +1s, margin display |
| **Cypher System** | d20 | d20 + Edge/Effort vs. TN = difficulty×3 | Natural 19/20 effects, GM intrusions |
| **Mörk Borg / OSR d20 family** | d20 + d6/d10 | d20 roll-over vs. TN | Natural 1 fumble, natural 20 crit (per-game specifics vary) |

---

## Sources
- Star Wars FFG narrative dice faces & cancellation: [R0-11 SWRPG Dice Guide](https://r011.swrpg.online/explore), [Star Wars RPG FFG Wiki — Narrative Dice](https://star-wars-rpg-ffg.fandom.com/wiki/Narrative_Dice)
- L5R 5e dice faces & mechanics: [RPoL L5R Quick Guide](https://rpol.net/display.cgi?gi=80179&ti=5), [Let's Study L5R Part 2](https://philgamer.wordpress.com/2018/11/08/lets-study-legend-of-the-five-rings-part-2-the-mechanics/), [SkyJedi L5R Discord Dice Roller](https://github.com/SkyJedi/L5R-Discord-Dice-Roller)
- Call of Cthulhu 7e: [Chaosium CoC Wiki — Skill Rolls](https://cthulhuwiki.chaosium.com/rules/skill-rolls-and-difficulty-levels.html), [mythos.wiki CoC 7e Cheat Sheet](https://mythos.wiki/index.php/Call_of_Cthulhu_7th_Edition_Cheat_Sheet)
- VtM V5 & WoD: [VTM Wiki — Basic Mechanics](https://vtm.paradoxwikis.com/Basic_Mechanics), [Table Games Hub VtM calculator](https://tablegameshub.com/vampire-the-masquerade-dice-calculator/), [White Wolf Wiki — Difficulty](https://whitewolf.fandom.com/wiki/Difficulty)
- Blades in the Dark: [Official SRD — Core System](https://bladesinthedark.com/core-system), [Action Roll](https://bladesinthedark.com/action-roll), [anydice BitD analysis](https://anydice.com/articles/blades-in-the-dark/)
- Savage Worlds: [Gamers Plane SW rules thread](https://gamersplane.com/forums/thread/15620/)
- Mothership: [RPG Stack Mothership dice rules](https://rpgstack.com/dice/mothership/rules)
- Cyberpunk RED: [RPG Stack roll resolution](https://rpgstack.com/cheat-sheets/cyberpunk_red/roll-resolution), [criticals FAQ](https://rpgstack.com/faq/cyberpunk_red/how-do-criticals-work)
- Ironsworn: [Necropticon basic dice guide](https://necropticon.com/guides/ironsworn-basic-dice-mechanics-guide/), [Ironsworn SRD](https://tedtschopp.github.io/Ironsworn-SRD/Ironsworn%20SRD.html)
- Kids on Bikes: [Netherbook starter guide](https://netherbook.com/pages/kids-on-bikes-starter-guide), [Gamers Plane KoB rules summary](https://gamersplane.com/forums/thread/30236/)
- Year Zero Engine: [Frank Mitchell — Year Zero Probabilities](https://www.frank-mitchell.com/posts/year-zero-probabilities/)
- 2d20: [Modiphius STA Dev Blog 003](https://modiphius.net/en-us/blogs/news/sta-dev-blog-003-a-guide-to-star-trek-adventures)
- PbtA: [Wikipedia — Powered by the Apocalypse](https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse), [1d6chan Apocalypse World](https://1d6chan.miraheze.org/wiki/Apocalypse_World)
- Shadowrun 6e: [RPG Stack SR6 dice pool](https://rpgstack.com/dice-mechanics/shadowrun/dice-pool)
- Daggerheart: [Daggerheart SRD — Rules](https://daggerheartsrd.com/rules/)
- Fudge dice: [2d4chan Fudge dice](https://2d4chan.org/wiki/Fudge_dice), [dice-roller Fudge documentation](https://dice-roller.github.io/documentation/guide/notation/dice.html)
