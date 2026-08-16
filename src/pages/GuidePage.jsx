import {
  BookOpen,
  Database,
  HelpCircle,
  Map,
  MousePointer2,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";

import "./GuidePage.css";

const guideSections = [
  {
    id: "getting-started",
    number: "01",
    icon: BookOpen,
    title: "GETTING STARTED",
    intro:
      "S.E.A.F. L.E.M.O.N. is a simple reference tool for finding information about the current galactic war from the perspective of the Sicaris S.E.A.F., planets, deployed forces, and regiment equipment.",
    items: [
      {
        title: "Open the navigation menu",
        text:
          "Use the menu button in the top-right corner of the screen. From there you can move between the site's different databases without needing to return to the home page.",
      },
      {
        title: "Choose what you need",
        text:
          "Use the Galactic Map when you want to see where things are happening. Use the Planet Database when you want to look up a specific planet. Use Regiment Loadouts when you want to see what equipment a regiment is authorized to use.",
      },
      {
        title: "You do not need an account",
        text:
          "The site is designed to be used as a reference tool. Open a page, find the information you need, and move on.",
      },
    ],
  },

  {
    id: "galactic-map",
    number: "02",
    icon: Map,
    title: "GALACTIC MAP",
    intro:
      "The Galactic Map gives you a visual overview of the war and lets you inspect individual planets and the forces associated with them.",
    items: [
      {
        title: "Find a planet",
        text:
          "Use the search box in the map area to enter a planet name or planet ID. Select FIND and the map will move to the matching planet.",
      },
      {
        title: "Move around the map",
        text:
          "Click and drag the map to move around the galaxy. You can also use the arrow keys to pan the map with the keyboard. Hold SHIFT while pressing an arrow key to move farther with each input. Use the mouse wheel or the zoom controls to change the map's zoom level.",
      },
      {
        title: "Use the zoom controls",
        text:
          "The + and − controls change the map's zoom level. A percentage between them shows your current zoom.",
      },
      {
        title: "Select a planet",
        text:
          "Click a planet on the map to open its information panel. The panel shows the planet's name, faction, and sector when that information is available.",
      },
      {
        title: "Check Forward Operating Bases",
        text:
          "If a selected planet has Forward Operating Bases, they will appear in the planet panel. Select a base to see its available Warbonds, health, and supplies.",
      },
      {
        title: "Check deployed regiments",
        text:
          "If regiments are deployed on the selected planet, their icons will appear in the planet panel. Select a regiment to see its specialty, FDP, surplus, and Warbonds.",
      },
      {
        title: "Watch for SOS Callouts",
        text:
          "A planet may also display a SOS Callouts when a regiment is in need of support.",
      },
    ],
  },

  {
    id: "planet-database",
    number: "03",
    icon: Database,
    title: "PLANET DATABASE",
    intro:
      "The Planet Database is the easiest place to look up detailed information about a planet without using the map.",
    items: [
      {
        title: "Search",
        text:
          "Type a planet name, ID, sector, or biome into the search box. The table updates automatically as you type.",
      },
      {
        title: "Filter by sector",
        text:
          "Use ALL SECTORS or select a specific sector to show only planets in that sector.",
      },
      {
        title: "Filter by faction",
        text:
          "Use ALL FACTIONS or select a faction to narrow the list to planets associated with that faction.",
      },
      {
        title: "Read the table",
        text:
          "Each row can show the planet ID, planet name, sector, X and Y coordinates, biome, and faction.",
      },
      {
        title: "Use more than one filter",
        text:
          "Search, sector, and faction filters work together. For example, you can search for a biome while also limiting the results to one sector.",
      },
      {
        title: "Refresh the database",
        text:
          "Select REFRESH when you want the page to request the latest available planetary data.",
      },
      {
        title: "View raw data",
        text:
          "Each planet also has a VIEW RAW DATA option. This is intended for people who need the complete underlying record rather than the simplified table.",
      },
    ],
  },

  {
    id: "regiments",
    number: "04",
    icon: Shield,
    title: "REGIMENT LOADOUTS",
    intro:
      "Regiment Loadouts show the equipment and stratagems authorized for each regiment. This is the best place to answer questions such as 'What can this regiment take?' or 'What does this stratagem do?'",
    items: [
      {
        title: "Find a regiment",
        text:
          "Use SEARCH LOADOUTS to search by regiment name, equipment category, or stratagem name.",
      },
      {
        title: "Read the slots",
        text:
          "Each regiment is divided into numbered slots. Every slot represents an equipment or stratagem a S.E.A.F. Trooper is authorized to take on a mission.",
      },
      {
        title: "Select a stratagem",
        text:
          "Click a stratagem icon to open its detailed information. Click it again, or use the arrow in the information panel, to collapse it.",
      },
      {
        title: "Identify the loadout category",
        text:
          "The LOADOUT label tells you which part of the regiment's equipment list the stratagem belongs to.",
      },
      {
        title: "Read the stratagem code",
        text:
          "If a stratagem code is available, the arrows show the sequence you need to enter in-game.",
      },
      {
        title: "Check cooldown and unlock information",
        text:
          "The information panel can show cooldown, unlock level, and cost when those details are available.",
      },
      {
        title: "Check traits and module information",
        text:
          "Additional tags describe the stratagem's traits. Some records also identify the ship module associated with the stratagem.",
      },
      {
        title: "Read the tactical description",
        text:
          "The description explains what the stratagem is and what it is used for. This information is retrieved from the stratagem reference library.",
      },
      {
        title: "Open the full record",
        text:
          "OPEN FULL STRATAGEM RECORD takes you to the full external reference page when you want more information.",
      },
    ],
  },

  {
    id: "refreshing",
    number: "05",
    icon: RefreshCw,
    title: "KEEPING INFORMATION UP TO DATE",
    intro:
      "Most information on S.E.A.F. L.E.M.O.N. comes from external data sources, so the site may need a moment to synchronize before displaying the latest information.",
    items: [
      {
        title: "What does SYNCING mean?",
        text:
          "The page is currently requesting information. Give it a moment before trying another action.",
      },
      {
        title: "What does ONLINE mean?",
        text:
          "The page successfully loaded the information it needs.",
      },
      {
        title: "What does PARTIAL mean?",
        text:
          "The main page loaded, but some additional information—such as the stratagem library—was unavailable.",
      },
      {
        title: "Use REFRESH when needed",
        text:
          "Refresh buttons request fresh data for that particular page. They are useful if information appears outdated or a previous request failed.",
      },
      {
        title: "If something is still missing",
        text:
          "Try refreshing once more. If the problem continues, the external data source may temporarily be unavailable.",
      },
    ],
  },

  {
    id: "troubleshooting",
    number: "06",
    icon: HelpCircle,
    title: "IF SOMETHING ISN'T WORKING",
    intro:
      "Most problems are temporary data or connection issues. Try these steps before assuming something is wrong with your browser.",
    items: [
      {
        title: "The page says SYNCING for a long time",
        text:
          "Wait a few seconds, then use the page's REFRESH or RETRY button if one is available.",
      },
      {
        title: "A planet search returns nothing",
        text:
          "Try searching for only part of the planet name or use its ID. On the Planet Database, also check that your sector and faction filters are set correctly.",
      },
      {
        title: "A regiment has no stratagem details",
        text:
          "The regiment data and the stratagem library come from different sources. The loadout can still appear even when the additional stratagem information is temporarily unavailable.",
      },
      {
        title: "A stratagem description is missing",
        text:
          "The description is additional reference information. If it cannot be retrieved, the loadout itself should still remain usable.",
      },
      {
        title: "The data looks outdated",
        text:
          "Use the relevant REFRESH button. Some supplemental stratagem information may also be temporarily cached, so a newly changed record may not appear immediately.",
      },
    ],
  },
];

function GuideSection({
  section,
}) {
  const Icon = section.icon;

  return (
    <section
      id={section.id}
      className="guide-section"
    >
      <div className="guide-section-heading">
        <div className="guide-section-number">
          {section.number}
        </div>

        <div className="guide-section-icon">
          <Icon size={20} />
        </div>

        <div>
          <div className="guide-section-kicker">
            USER GUIDE // {section.number}
          </div>

          <h2>{section.title}</h2>
        </div>
      </div>

      <p className="guide-section-intro">
        {section.intro}
      </p>

      <div className="guide-items">
        {section.items.map(
          (item, index) => (
            <article
              className="guide-item"
              key={`${section.id}-${index}`}
            >
              <div className="guide-item-marker">
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </div>

              <div>
                <h3>{item.title}</h3>

                <p>{item.text}</p>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="guide-page">
      <header className="guide-header">
        <div className="guide-header-title">
          <BookOpen size={22} />

          <div>
            <span>
              S.E.A.F. // L.E.M.O.N
            </span>

            <small>
              USER GUIDE
            </small>
          </div>
        </div>

        <div className="guide-header-status">
          <span>DOCUMENTATION</span>
          <strong>READY</strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="guide-content">
        <section className="guide-hero">
          <div>
            <div className="guide-kicker">
              PERSONNEL ORIENTATION //
              FIELD REFERENCE
            </div>

            <h1>
              HOW TO USE S.E.A.F. L.E.M.O.N.
            </h1>

            <p>
              A simple guide to finding
              planets, tracking the war,
              checking deployed forces,
              and understanding regiment
              loadouts.
            </p>
          </div>

          <div className="guide-hero-note">
            <BookOpen size={18} />

            <div>
              <strong>
                NEW TO THE SITE?
              </strong>

              <span>
                Start with the Galactic
                Map, then use the databases
                when you need specific
                information.
              </span>
            </div>
          </div>
        </section>

        <section className="guide-quick-start">
          <div className="guide-quick-start-header">
            <div>
              <div className="guide-kicker">
                QUICK START
              </div>

              <h2>
                THREE THINGS TO KNOW
              </h2>
            </div>
          </div>

          <div className="guide-quick-grid">
            <div className="guide-quick-card">
              <Map size={20} />

              <strong>
                SEE THE WAR
              </strong>

              <p>
                Open GALACTIC MAP to
                explore planets and see
                associated forces.
              </p>
            </div>

            <div className="guide-quick-card">
              <Search size={20} />

              <strong>
                FIND SOMETHING
              </strong>

              <p>
                Use the search fields
                instead of scrolling through
                large lists.
              </p>
            </div>

            <div className="guide-quick-card">
              <MousePointer2 size={20} />

              <strong>
                CLICK FOR DETAILS
              </strong>

              <p>
                Many map and regiment
                elements reveal more
                information when selected.
              </p>
            </div>
          </div>
        </section>

        <nav
          className="guide-contents"
          aria-label="Guide sections"
        >
          <div className="guide-contents-label">
            IN THIS GUIDE
          </div>

          <div className="guide-contents-links">
            {guideSections.map(
              (section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                >
                  <span>
                    {section.number}
                  </span>

                  {section.title}
                </a>
              )
            )}
          </div>
        </nav>

        <section className="guide-sections">
          {guideSections.map(
            (section) => (
              <GuideSection
                key={section.id}
                section={section}
              />
            )
          )}
        </section>

        <section className="guide-final">
          <Shield size={22} />

          <div>
            <div className="guide-final-kicker">
              FIELD REFERENCE COMPLETE
            </div>

            <h2>
              WHEN IN DOUBT, START WITH
              THE MAP.
            </h2>

            <p>
              The Galactic Map is the
              best starting point for
              understanding where things
              are happening. Use the Planet
              Database for detailed planet
              information and Regiment
              Loadouts for equipment and
              stratagem information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
