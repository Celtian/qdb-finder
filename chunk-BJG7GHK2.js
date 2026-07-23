import{$ as D,$a as d,D as C,F as n,I as b,J as _,K as k,O as m,P as p,Q as M,R as F,S as h,T as g,U as v,V as r,Va as R,W as i,Xa as L,Ya as E,Za as z,_ as c,_a as j,aa as I,ha as A,ja as o,ka as l,la as y,o as x,oa as S,p as w,q as f,ta as T,va as P,za as O}from"./chunk-MES6IOKN.js";var N=["*"];var G=new w("MAT_CARD_CONFIG"),q=(()=>{class e{appearance;constructor(){let t=f(G,{optional:!0});this.appearance=t?.appearance||"raised"}static \u0275fac=function(s){return new(s||e)};static \u0275cmp=b({type:e,selectors:[["mat-card"]],hostAttrs:[1,"mat-mdc-card","mdc-card"],hostVars:8,hostBindings:function(s,u){s&2&&A("mat-mdc-card-outlined",u.appearance==="outlined")("mdc-card--outlined",u.appearance==="outlined")("mat-mdc-card-filled",u.appearance==="filled")("mdc-card--filled",u.appearance==="filled")},inputs:{appearance:"appearance"},exportAs:["matCard"],ngContentSelectors:N,decls:1,vars:0,template:function(s,u){s&1&&(D(),I(0))},styles:[`.mat-mdc-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  border-style: solid;
  border-width: 0;
  background-color: var(--mat-card-elevated-container-color, var(--mat-sys-surface-container-low));
  border-color: var(--mat-card-elevated-container-color, var(--mat-sys-surface-container-low));
  border-radius: var(--mat-card-elevated-container-shape, var(--mat-sys-corner-medium));
  box-shadow: var(--mat-card-elevated-container-elevation, var(--mat-sys-level1));
}
.mat-mdc-card::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: solid 1px transparent;
  content: "";
  display: block;
  pointer-events: none;
  box-sizing: border-box;
  border-radius: var(--mat-card-elevated-container-shape, var(--mat-sys-corner-medium));
}

.mat-mdc-card-outlined {
  background-color: var(--mat-card-outlined-container-color, var(--mat-sys-surface));
  border-radius: var(--mat-card-outlined-container-shape, var(--mat-sys-corner-medium));
  border-width: var(--mat-card-outlined-outline-width, 1px);
  border-color: var(--mat-card-outlined-outline-color, var(--mat-sys-outline-variant));
  box-shadow: var(--mat-card-outlined-container-elevation, var(--mat-sys-level0));
}
.mat-mdc-card-outlined::after {
  border: none;
}

.mat-mdc-card-filled {
  background-color: var(--mat-card-filled-container-color, var(--mat-sys-surface-container-highest));
  border-radius: var(--mat-card-filled-container-shape, var(--mat-sys-corner-medium));
  box-shadow: var(--mat-card-filled-container-elevation, var(--mat-sys-level0));
}

.mdc-card__media {
  position: relative;
  box-sizing: border-box;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}
.mdc-card__media::before {
  display: block;
  content: "";
}
.mdc-card__media:first-child {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}
.mdc-card__media:last-child {
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

.mat-mdc-card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  min-height: 52px;
  padding: 8px;
}

.mat-mdc-card-title {
  font-family: var(--mat-card-title-text-font, var(--mat-sys-title-large-font));
  line-height: var(--mat-card-title-text-line-height, var(--mat-sys-title-large-line-height));
  font-size: var(--mat-card-title-text-size, var(--mat-sys-title-large-size));
  letter-spacing: var(--mat-card-title-text-tracking, var(--mat-sys-title-large-tracking));
  font-weight: var(--mat-card-title-text-weight, var(--mat-sys-title-large-weight));
}

.mat-mdc-card-subtitle {
  color: var(--mat-card-subtitle-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-card-subtitle-text-font, var(--mat-sys-title-medium-font));
  line-height: var(--mat-card-subtitle-text-line-height, var(--mat-sys-title-medium-line-height));
  font-size: var(--mat-card-subtitle-text-size, var(--mat-sys-title-medium-size));
  letter-spacing: var(--mat-card-subtitle-text-tracking, var(--mat-sys-title-medium-tracking));
  font-weight: var(--mat-card-subtitle-text-weight, var(--mat-sys-title-medium-weight));
}

.mat-mdc-card-title,
.mat-mdc-card-subtitle {
  display: block;
  margin: 0;
}
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-title,
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-subtitle {
  padding: 16px 16px 0;
}

.mat-mdc-card-header {
  display: flex;
  padding: 16px 16px 0;
}

.mat-mdc-card-content {
  display: block;
  padding: 0 16px;
}
.mat-mdc-card-content:first-child {
  padding-top: 16px;
}
.mat-mdc-card-content:last-child {
  padding-bottom: 16px;
}

.mat-mdc-card-title-group {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.mat-mdc-card-avatar {
  height: 40px;
  width: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-bottom: 16px;
  object-fit: cover;
}
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-subtitle,
.mat-mdc-card-avatar ~ .mat-mdc-card-header-text .mat-mdc-card-title {
  line-height: normal;
}

.mat-mdc-card-sm-image {
  width: 80px;
  height: 80px;
}

.mat-mdc-card-md-image {
  width: 112px;
  height: 112px;
}

.mat-mdc-card-lg-image {
  width: 152px;
  height: 152px;
}

.mat-mdc-card-xl-image {
  width: 240px;
  height: 240px;
}

.mat-mdc-card-subtitle ~ .mat-mdc-card-title,
.mat-mdc-card-title ~ .mat-mdc-card-subtitle,
.mat-mdc-card-header .mat-mdc-card-header-text .mat-mdc-card-title,
.mat-mdc-card-header .mat-mdc-card-header-text .mat-mdc-card-subtitle,
.mat-mdc-card-title-group .mat-mdc-card-title,
.mat-mdc-card-title-group .mat-mdc-card-subtitle {
  padding-top: 0;
}

.mat-mdc-card-content > :last-child:not(.mat-mdc-card-footer) {
  margin-bottom: 0;
}

.mat-mdc-card-actions-align-end {
  justify-content: flex-end;
}
`],encapsulation:2})}return e})();var B=(()=>{class e{static \u0275fac=function(s){return new(s||e)};static \u0275dir=k({type:e,selectors:[["mat-card-content"]],hostAttrs:[1,"mat-mdc-card-content"]})}return e})();var H=(()=>{class e{static \u0275fac=function(s){return new(s||e)};static \u0275mod=_({type:e});static \u0275inj=x({imports:[R]})}return e})();var U=[{label:"Search basics",href:"/searching"},{label:"Player guide",href:"/players"},{label:"Teams and leagues",href:"/teams-and-leagues"},{label:"Referees and stadiums",href:"/referees-and-stadiums"}],V={overview:{eyebrow:"QDB Finder",title:"Explore FIFA 11 through FIFA 23 in one place",lead:"A fast, offline database explorer built for detailed, edition-specific discovery.",sections:[{title:"Five connected finders",paragraphs:["Browse the bundled FIFA 11 through FIFA 23 editions without learning table names or source-field codes. Every result represents one entity in one installed database and one FIFA edition."],items:["Players: names, nationalities, squads, positions, ratings and complete attribute details.","Teams: competitions, countries, squad sizes, ratings, players and home stadiums.","Leagues: countries, tiers, competition type, team and player counts, and assigned referees.","Referees: identity, nationality, physical data, strictness values and league assignments.","Stadiums: country, capacity, construction year, pitch dimensions, licensing and linked teams."],links:U},{title:"Follow the relationships",paragraphs:["Detail dialogs link related records without losing the selected database or FIFA edition. Move from a player to every linked team, from a league to its players, teams or referees, and from a stadium to its teams.","Context banners explain why a finder is constrained. Ordinary filters can still be combined with that context, and Clear returns to an unconstrained finder."]},{title:"Local and inspectable",paragraphs:["An optimized SQLite database ships with the desktop application, and compatible custom databases can be imported as isolated local copies. Searching needs no account or network connection, and raw source fields remain available in the final tab of every detail dialog."],links:[{label:"Download the latest release",href:d.links.latestRelease,external:!0},{label:"Installation guide",href:"/installation"},{label:"Databases and settings",href:"/databases-and-settings"}]}]},installation:{eyebrow:"Getting started",title:"Install QDB Finder",lead:"Windows x64 is the first supported desktop target.",sections:[{title:"Choose a Windows package",paragraphs:["Download the current build from GitHub Releases. Both distributions contain the desktop application and its generated FIFA database."],items:["Squirrel installer: installs QDB Finder for the current Windows user and provides the standard installed-app experience.","ZIP package: extract it to a folder and run the application without an installer."],links:[{label:"Open the latest release",href:d.links.latestRelease,external:!0}]},{title:"First launch",paragraphs:["Initial builds are unsigned, so Windows SmartScreen may display a warning. Confirm that the package came from the Celtian/qdb-finder release page before choosing to run it.","No separate database download or setup is required. Open the application and select Players, Teams, Leagues, Referees or Stadiums from the home screen or navigation menu."],note:"The packaged application is offline-first. GitHub is needed to download updates, not to search the database.",links:[{label:"Manage databases and settings",href:"/databases-and-settings"}]},{title:"Build from source",paragraphs:["Developers can generate the database and run Electron from the repository instead of installing a release build."],links:[{label:"Development setup",href:"/development"},{label:"Browse the source",href:d.links.repository,external:!0}]}]},searching:{eyebrow:"User guide",title:"Searching and filtering",lead:"Search as you type, then apply a precise set of composable filters.",sections:[{title:"Database and edition records",paragraphs:["A real-world player, team or venue can occur in several installed databases and FIFA editions. QDB Finder therefore keeps the database, FIFA version and Original ID together as the identity of a result.","Enter a numeric Original ID by itself for an exact ID lookup, or use the main search box to find entity names and the additional player text documented by the player guide. The search updates as you type, and opening a result preserves its database and edition."]},{title:"Apply exact filters",paragraphs:["Open Filters to choose installed databases and FIFA editions or add category, autocomplete and numeric-range constraints. Autocomplete choices such as nationality, team, league and country resolve to exact database values and remain visible as removable selections.","Changes are staged in the drawer. Apply runs one search from the first result page, Cancel discards the draft, and Clear all removes the draft filters before they are applied. Applied filters are saved locally for that finder; search text is not saved."],note:"Selecting Women with FIFA 11\u201315 is valid and produces an empty result. QDB Finder never changes the selected editions automatically."},{title:"Columns, sorting and pagination",paragraphs:["Columns opens a drawer containing every field available to that finder. Drag a column handle to change its position, or focus the handle and use the Up and Down arrow keys. The entity-name column remains visible.","Apply saves both column visibility and order locally for that finder. Reset to defaults restores the default visibility and order.","Sortable visible column headers order results inside SQLite before pagination. The result count and paginator describe the complete filtered population rather than only the 25, 50 or 100 rows currently visible."],items:["Clearing the search box leaves applied filters and column choices unchanged.","Applying filters returns to the first page without changing search text, page size or sorting.","An empty state explains that no records match the current search and filters.","Database errors show a retry action without discarding the current request.","Wide result tables scroll horizontally on narrow windows instead of compressing values into overlapping columns."]},{title:"Contextual finders",paragraphs:["Actions in detail dialogs open another finder with an exact-database, exact-edition relationship constraint. A banner names the source context while ordinary filters continue to work within it.","Clear on the context banner removes the relationship and applied filters while preserving search text, sort and page size. Changing the database filter also removes an incompatible context; incomplete or conflicting URL contexts are rejected."],links:U.slice(1)}]},"databases-and-settings":{eyebrow:"User guide",title:"Databases and settings",lead:"Manage local data sources, finder preferences and the application appearance.",sections:[{title:"Search installed databases",paragraphs:["The Databases page lists the protected built-in database and every custom database, including their supported FIFA editions, record totals and generated or imported date. Incompatible databases remain visible with an explanation but are excluded from search.","Compatible databases are searched together by default. Open Filters in any finder to select one database, several databases or All databases; results and detail headers identify the database that supplied each record."]},{title:"Import a custom database",paragraphs:["The four-step wizard chooses a format and source, validates the data, then shows a final summary before creating output. Import either a folder that directly contains FIFA 11\u201323 text tables or a PC fifa_ng_db.db file together with its matching metadata XML.","Direct t3db import supports PC format version 8. Xbox byte order, other binary versions, invalid metadata and incompatible schemas are rejected."],items:["A uniquely detected FIFA edition is selected automatically; uncertain sources require a manual edition before validation.","Validation scans structure, values, canonical identifiers, published ranges and relationships without creating output. Advisory metadata warnings remain importable.","Validation and import can be cancelled. Temporary output is removed, and the selected source folder or files are never modified.","A successful import creates an isolated SQLite file in the application-data directory and joins all-database searches immediately."]},{title:"Remove custom data safely",paragraphs:["Use the delete action on a Databases card to remove one custom database, or Settings to remove all custom databases after confirmation. The built-in database and every original source remain protected.","Removing all custom databases also clears saved finder filters so they cannot retain database identifiers that no longer exist. A custom database created with an incompatible future QDB schema must be re-imported from its original source."]},{title:"Appearance and finder preferences",paragraphs:["Settings can follow the operating system appearance or force the light or dark application theme. The selected theme is saved locally.","Each finder also saves its applied database and data filters plus its column visibility and order. Reset filters and columns clears those saved finder preferences, including the saved column order, after confirmation without changing search text, installed databases or the application theme."],links:[{label:"Searching and filters",href:"/searching"},{label:"Database generation for developers",href:"/database"}]}]},players:{eyebrow:"User guide",title:"Players",lead:"Find a player edition, compare ratings and inspect the complete source record.",sections:[{title:"Find and filter players",paragraphs:["The player search box accepts an exact numeric Original ID, or covers player and alternate names as well as linked teams, leagues and countries. Exact filters can be combined freely."],items:["FIFA editions, gender, nationalities, teams, leagues and playable positions.","Minimum and maximum age, overall rating and potential rating.","All, Men and Women gender choices; women player records are available from FIFA 16."],note:"FIFA 11\u201315 source tables do not contain women player records and are normalized as Men."},{title:"Read the results",paragraphs:["Available columns cover the source database, Original ID, FIFA edition, nationality, linked teams, positions, birth date, contract end, age, height, weight, preferred foot, overall, potential and best position rating. Use Columns to choose which appear beside the required player name.","Position pills keep their football-role colors. Rating pills use shared red-to-green value bands, making score comparisons consistent throughout the app."]},{title:"Player details",paragraphs:["The summary keeps overall, potential, best rating and age visible above four detail tabs."],items:["Profile: full and display names, readable birth and snapshot dates, height, weight, preferred foot and work rates.","Position matrix: every supported position in a pitch-aligned layout, including separate sweeper and goalkeeper rows; tile colors reflect the rating value.","Attributes: Attacking, Skill, Movement, Power, Mentality, Defending, Goalkeeping and Special groups, with potential and a numeric five-star international reputation.","Raw fields: the untouched source keys and values for the selected FIFA player table record."]},{title:"View linked teams",paragraphs:["The persistent View teams action opens every squad linked to that exact player edition, including club, national and special teams. The Teams finder displays the player context and lets normal team filters refine it."],links:[{label:"Search basics",href:"/searching"},{label:"Teams and leagues guide",href:"/teams-and-leagues"}]}]},"teams-and-leagues":{eyebrow:"User guide",title:"Teams and leagues",lead:"Compare squads and competitions while keeping every relationship edition-specific.",sections:[{title:"Team finder",paragraphs:["Search team names or an exact numeric Original ID, then filter by FIFA edition, exact league, country, national-team status and overall, attack, midfield or defence rating ranges.","Available columns cover the source database, Original ID, edition, country, national-team status, league, squad size and the four sortable rating measures. National teams take their country from the source team-to-nation link. Use Columns to choose which appear beside the required team name."]},{title:"Team details and actions",paragraphs:["The team summary includes its ratings, squad size and foundation year. Overview shows a top-rated squad preview and the linked home stadium when available; Raw fields preserves the source team record."],items:["View all players opens the complete exact-edition squad in the Players finder.","View stadium opens the linked home ground when the source data supplies one.","Team results can also be constrained by a player, league or stadium context."]},{title:"League finder",paragraphs:["Search league names or an exact numeric Original ID and filter by FIFA edition, country and competition tier. Available columns include the source database, Original ID, edition, country, tier, team count and player count.","League details identify men\u2019s or women\u2019s competition data and preview both top-rated teams and assigned referees before the Raw fields tab."]},{title:"Move through a competition",paragraphs:["League actions open the complete exact-edition population of teams, referees or players. A referee detail can return to its assigned leagues, so the context remains traceable in either direction."],links:[{label:"Player guide",href:"/players"},{label:"Referees and stadiums guide",href:"/referees-and-stadiums"}]}]},"referees-and-stadiums":{eyebrow:"User guide",title:"Referees and stadiums",lead:"Inspect officials and venues together with their exact competition and team links.",sections:[{title:"Referee finder",paragraphs:["Search referee names or an exact numeric Original ID and filter by FIFA edition, gender, nationality, assigned league, age range and real or generic referee type.","Available columns cover the source database, Original ID, edition, nationality, league assignments, birth date, age, height, weight and whether the official represents a real person. Use Columns to choose which appear beside the required referee name."],note:"Women referee data is available from FIFA 16. FIFA 11\u201315 records are treated as Men because those source tables have no gender field."},{title:"Referee details",paragraphs:["Summary metrics cover age, height, weight, real-referee status and foul/card strictness. Overview lists linked league editions, Raw fields exposes the source record, and View leagues opens the complete assignment set."]},{title:"Stadium finder",paragraphs:["Search stadium names or an exact numeric Original ID and filter by FIFA edition, country, exact linked team, capacity range and licensed or generic stadium type.","Available columns cover the source database, Original ID, edition, country, linked-team count, capacity, construction year, pitch dimensions and licensing status. Use Columns to choose which appear beside the required stadium name."]},{title:"Stadium details and teams",paragraphs:["The stadium summary includes capacity, year built, pitch size, linked-team count, licensing and small-sided status. Overview previews linked teams and Raw fields preserves the source stadium data.","View teams opens all teams associated with that exact stadium edition and keeps the stadium named in the finder context."],links:[{label:"Search basics",href:"/searching"},{label:"Teams and leagues guide",href:"/teams-and-leagues"}]}]},"supported-data":{eyebrow:"Data coverage",title:"FIFA 11 through FIFA 23",lead:"Every supplied table covered by fifatables 0.2.10 is preserved.",sections:[{title:"Canonical searchable data",paragraphs:["The bundled database validates 306 source files across 25 definitions and builds normalized, indexed records for the five searchable entity types."],items:["227,572 player editions and 241,640 team-player links.","8,907 team editions and 8,890 stadium-team links.","560 league editions and 3,001 referee-league links.","2,516 referee editions and 1,371 stadium editions."]},{title:"Historical variation",paragraphs:["Older FIFA editions can contain fewer attributes or relationships than newer games. QDB Finder preserves sparse values, keeps pitch positions stable and displays unavailable presentation fields as an em dash.","Raw fields retain the source-table vocabulary for research and troubleshooting even when the normalized interface uses more readable labels."]}]},development:{eyebrow:"Contributing",title:"Development commands",lead:"Node 24.18 and Yarn Classic 1.22.22 are the supported toolchain.",sections:[{title:"Run and verify",paragraphs:["Generate the database before starting Electron and run the complete validation before publishing changes."],code:`yarn install --frozen-lockfile
yarn db:build
yarn start

yarn format:check
yarn lint
yarn test
yarn build`,links:[{label:"Browse the repository",href:d.links.repository,external:!0}]}]},database:{eyebrow:"Development",title:"Deterministic database generation",lead:"Release builds generate SQLite from the checked-in UTF-16LE TSV files.",sections:[{title:"Build and validate",paragraphs:["Headers, row structure, numeric values and canonical identifiers are checked against fifatables before raw tables, canonical indexes and the FTS5 player-search index are generated. Published range and relationship anomalies remain visible as advisory warnings for modified databases. Integrity, foreign-key, ANALYZE and VACUUM checks finish the build."],code:`yarn db:build
yarn db:validate`},{title:"Read-only runtime",paragraphs:["Electron opens searchable SQLite files read-only. Search values are parameterized, sort and table choices are constrained in code, and the renderer reaches the main-process query and import services only through the typed, sandboxed preload API."]},{title:"Desktop imports",paragraphs:["The desktop application reuses the same validation and normalized database builder for user-selected text folders and decoded PC t3db sources. Import and validation run outside the renderer and write only to an isolated temporary output before installation."],links:[{label:"Custom database user guide",href:"/databases-and-settings"}]}]},licensing:{eyebrow:"Legal",title:"Licensing and data",lead:"Application code and the three FIFA helper libraries are MIT licensed.",sections:[{title:"Application license",paragraphs:["The QDB Finder source code is available under the MIT License. Contributions are accepted under the repository\u2019s contribution and conduct policies."],links:[{label:"Read the MIT License",href:d.links.license,external:!0}]},{title:"Data redistribution",paragraphs:["Redistributors remain responsible for confirming that supplied FIFA game database content may legally be shipped in their jurisdiction."]}]},releases:{eyebrow:"Distribution",title:"GitHub Releases",lead:"Version tags create reproducible Windows x64 artifacts and static documentation.",sections:[{title:"Release flow",paragraphs:["A matching v* tag installs from yarn.lock, generates and validates SQLite, runs checks, uploads the Squirrel and ZIP artifacts to a draft release, and then publishes it. Non-beta tags also deploy this prerendered documentation to GitHub Pages.",`This documentation build identifies itself as ${d.versionLabel} and links to the immutable source tag used to produce it.`],links:[{label:`Source for ${d.versionLabel}`,href:d.links.version,external:!0},{label:"Latest download",href:d.links.latestRelease,external:!0},{label:"Changelog",href:d.links.changelog,external:!0}]}]}};var X=(e,a)=>a.title,Z=(e,a)=>a.href;function Y(e,a){if(e&1&&(r(0,"p"),o(1),i()),e&2){let t=a.$implicit;n(),l(t)}}function J(e,a){if(e&1&&(r(0,"li"),o(1),i()),e&2){let t=a.$implicit;n(),l(t)}}function K(e,a){if(e&1&&(r(0,"ul"),h(1,J,2,1,"li",null,F),i()),e&2){let t=c().$implicit;n(),g(t.items)}}function ee(e,a){if(e&1&&(r(0,"mat-card",2)(1,"mat-card-content")(2,"mat-icon"),o(3,"info"),i(),r(4,"p")(5,"strong"),o(6,"Note:"),i(),o(7),i()()()),e&2){let t=c().$implicit;n(7),y(" ",t.note)}}function te(e,a){if(e&1&&(r(0,"mat-card",3)(1,"mat-card-content")(2,"pre")(3,"code"),o(4),i()()()()),e&2){let t=c().$implicit;n(4),l(t.code)}}function ae(e,a){if(e&1&&(r(0,"a",5),o(1),r(2,"mat-icon"),o(3,"open_in_new"),i()()),e&2){let t=c().$implicit;v("href",t.href,C),n(),y(" ",t.label," ")}}function ne(e,a){if(e&1&&(r(0,"a",6),o(1),r(2,"mat-icon"),o(3,"arrow_forward"),i()()),e&2){let t=c().$implicit;v("routerLink",t.href),n(),y(" ",t.label," ")}}function ie(e,a){if(e&1&&m(0,ae,4,2,"a",5)(1,ne,4,2,"a",6),e&2){let t=a.$implicit;p(t.external?0:1)}}function re(e,a){if(e&1&&(r(0,"div",4),h(1,ie,2,1,null,null,Z),i()),e&2){let t=c().$implicit;n(),g(t.links)}}function oe(e,a){if(e&1&&(r(0,"section")(1,"h2"),o(2),i(),h(3,Y,2,1,"p",null,M),m(5,K,3,0,"ul"),m(6,ee,8,1,"mat-card",2),m(7,te,5,1,"mat-card",3),m(8,re,3,0,"div",4),i()),e&2){let t=a.$implicit;n(2),l(t.title),n(),g(t.paragraphs),n(2),p(t.items?5:-1),n(),p(t.note?6:-1),n(),p(t.code?7:-1),n(),p(t.links?8:-1)}}var Q=class e{route=f(T);data=O(this.route.data,{initialValue:this.route.snapshot.data});page=S(()=>V[String(this.data().slug??"overview")]);static \u0275fac=function(t){return new(t||e)};static \u0275cmp=b({type:e,selectors:[["app-home"]],decls:9,vars:3,consts:[[1,"eyebrow"],[1,"lead"],["appearance","outlined","role","note",1,"note"],["appearance","outlined",1,"code-card"],[1,"section-links"],["mat-stroked-button","",3,"href"],["mat-stroked-button","",3,"routerLink"]],template:function(t,s){t&1&&(r(0,"article")(1,"p",0),o(2),i(),r(3,"h1"),o(4),i(),r(5,"p",1),o(6),i(),h(7,oe,9,5,"section",null,X),i()),t&2&&(n(2),l(s.page().eyebrow),n(2),l(s.page().title),n(2),l(s.page().lead),n(),g(s.page().sections))},dependencies:[E,L,H,q,B,j,z,P],styles:["article[_ngcontent-%COMP%]{padding-bottom:1rem}.eyebrow[_ngcontent-%COMP%]{margin-top:0;color:var(--qdb-brand);font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}h1[_ngcontent-%COMP%]{max-width:760px;margin:.6rem 0 1rem;font-size:clamp(2rem,4vw,3.5rem);line-height:1.05;letter-spacing:-.035em}.lead[_ngcontent-%COMP%]{max-width:700px;margin-bottom:3rem;color:#5e6472;font-size:1.1rem;line-height:1.6}section[_ngcontent-%COMP%]{margin:2.5rem 0}h2[_ngcontent-%COMP%]{margin-bottom:.8rem;font-size:1.35rem}section[_ngcontent-%COMP%] > p[_ngcontent-%COMP%]{color:#465064;line-height:1.75}ul[_ngcontent-%COMP%]{display:grid;gap:.65rem;padding-left:1.25rem;color:#465064;line-height:1.65}.note[_ngcontent-%COMP%], .code-card[_ngcontent-%COMP%]{margin-top:1.25rem;border:1px solid var(--mat-sys-outline-variant);background:var(--mat-sys-surface-container-lowest)}.note[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]{display:flex;align-items:flex-start;gap:.75rem;padding:1rem}.note[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{flex:0 0 auto;color:var(--qdb-brand)}.note[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0;color:#324565;line-height:1.6}.code-card[_ngcontent-%COMP%]{overflow:hidden}.code-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]{padding:0}pre[_ngcontent-%COMP%]{overflow:auto;margin:0;padding:1.2rem;color:var(--mat-sys-on-surface);font-size:.875rem;line-height:1.6}.section-links[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1.25rem}.section-links[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--qdb-brand)}.section-links[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{margin-left:.3rem}@media(max-width:620px){.lead[_ngcontent-%COMP%]{margin-bottom:2.25rem}section[_ngcontent-%COMP%]{margin:2rem 0}}"]})};export{Q as Home};
