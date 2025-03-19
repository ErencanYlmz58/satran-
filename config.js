// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDLf5ts5mGdUMXDoSeToV-In_3sFQVyeik",
    authDomain: "schaakspel-2bfa9.firebaseapp.com",
    databaseURL: "https://schaakspel-2bfa9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "schaakspel-2bfa9",
    storageBucket: "schaakspel-2bfa9.firebasestorage.app",
    messagingSenderId: "1062722394805",
    appId: "1:1062722394805:web:d7f0543967bff5f7827cfc",
    measurementId: "G-7PD5Z9X6BB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Chess piece representation and mapping
const PIECES = {
    KING: {
        light: '♔',
        dark: '♚',
        name: 'Geliefde' // The Beloved
    },
    QUEEN: {
        light: '♕',
        dark: '♛',
        name: 'Muse' // The Muse
    },
    BISHOP: {
        light: '♗',
        dark: '♝',
        name: 'Cupido' // Cupid
    },
    KNIGHT: {
        light: '♘',
        dark: '♞',
        name: 'Dagdromer' // Daydreamer
    },
    ROOK: {
        light: '♖',
        dark: '♜',
        name: 'Hartstochtelijke Toren' // Passionate Tower
    },
    PAWN: {
        light: '♙',
        dark: '♟',
        name: 'Boodschapper van de Liefde' // Love Messenger
    }
};

// Romantic messages for moves and special events
const ROMANTIC_MESSAGES = {
    // Generic moves per piece type
    KING: [
        "De Geliefde zoekt beschutting in de armen van de ander...",
        "Met voorzichtige stappen beweegt de Geliefde over het liefdesveld...",
        "De Geliefde verlangt naar een veilige plek in het hart van de ander..."
    ],
    QUEEN: [
        "De Muse danst gracieus over het bord, op zoek naar inspiratie...",
        "Met elegantie beweegt de Muse, als een liefdessonnet in beweging...",
        "De Muse straalt, haar kracht zo betoverend als haar schoonheid..."
    ],
    BISHOP: [
        "Cupido schiet een pijl door het hart van de vijand...",
        "Diagonaal door de liefde beweegt Cupido, altijd op zoek naar verbinding...",
        "Cupido's vleugels dragen de boodschap van liefde over het slagveld..."
    ],
    KNIGHT: [
        "De Dagdromer galoppeert over het bord, op zoek naar liefde...",
        "Met gedurfde sprongen zoekt de Dagdromer een weg naar het hart...",
        "De Dagdromer weeft door het spel zoals gedachten door een verliefd hoofd..."
    ],
    ROOK: [
        "De Hartstochtelijke Toren beweegt zich met vastberaden liefde...",
        "Standvastig en trouw glijdt de Hartstochtelijke Toren over het bord...",
        "Als een vuurtoren in de storm wijst de Hartstochtelijke Toren de weg naar liefde..."
    ],
    PAWN: [
        "De Boodschapper van de Liefde brengt hoop in elke stap...",
        "Moedig stapt de Boodschapper voorwaarts op het pad van de liefde...",
        "Klein maar dapper, draagt de Boodschapper de belofte van toekomstige vreugde..."
    ],
    
    // Special move messages
    CAPTURE: [
        "Een hartstochtelijke omhelzing neemt de tegenstander gevangen!",
        "Liefde verovert alle hindernissen op haar pad...",
        "Twee zielen ontmoeten elkaar in een dans van verovering..."
    ],
    CHECK: [
        "Het hart klopt sneller wanneer de Geliefde in gevaar is...",
        "Pas op! De vlam van de liefde dreigt te doven...",
        "Een waarschuwing fluistert door de lucht - bescherm je hart..."
    ],
    CHECKMATE: [
        "Jullie liefde heeft deze strijd gewonnen!",
        "De harten zijn verenigd in een eeuwige omhelzing van overwinning!",
        "De sterren van de liefde schijnen helder op deze glorieuze overwinning!"
    ],
    CASTLE: [
        "De Geliefde en de Hartstochtelijke Toren vinden bescherming bij elkaar...",
        "Samen sterker - een dans van vertrouwen en strategische liefde...",
        "Een verbond wordt gesmeed tussen twee trouwe harten..."
    ],
    PROMOTION: [
        "De Boodschapper van de Liefde bloeit open tot zijn volle potentieel!",
        "Wat eens klein begon, is nu uitgegroeid tot ware grootsheid...",
        "Transformatie door liefde - de ultieme kracht van groei!"
    ],
    STALEMATE: [
        "Zelfs zonder winnaar is jullie liefde in evenwicht...",
        "Soms eindigt het verhaal van de liefde in perfecte harmonie...",
        "Noch overwinning, noch nederlaag - slechts een eeuwig liefdesgevecht..."
    ],
    DRAW: [
        "Jullie harten kloppen als één in deze liefdevolle gelijkspel...",
        "Soms is de liefde zo perfect in balans dat niemand verliest...",
        "Een eeuwige dans van gelijkwaardige liefde..."
    ],
    GAME_START: [
        "Laat jullie harten het oude spel van de liefde spelen...",
        "De zoete strijd van het hart begint nu...",
        "Moge de meest liefdevolle strategie zegevieren!"
    ],
    WAITING: [
        "Wachtend op je geliefde om het spel te beginnen...",
        "Het hart wacht geduldig op de komst van de ander...",
        "Liefde heeft soms geduld nodig - wachtend op je partner..."
    ],
    PLAYER_JOINED: [
        "Jullie harten zijn nu verbonden in dit romantische schaakspel!",
        "De liefde is compleet - jullie zijn nu samen in dit spel!",
        "Twee zielen, verenigd op het slagveld van het hart!"
    ]
};