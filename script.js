// =====================================
// COREIOT - SMART DASHBOARD
// =====================================
alert("COREIOT JAVA SCRIPT LOADED");
const $ = id => document.getElementById(id);

// Default values
const DEFAULT_BATTERY = 82;
const DEFAULT_SIGNAL = -85;
const DEFAULT_UPTIME = 14 * 60 + 22;

let battery = DEFAULT_BATTERY;
let signal = DEFAULT_SIGNAL;
let uptime = DEFAULT_UPTIME;

let map = null;
let marker = null;
let powerChart = null;

// =====================================
// SIDEBAR
// =====================================

const sidebar = $("sidebar");
const overlay = $("overlay");

function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
}

$("menuBtn").addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
});

$("closeSidebar").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// =====================================
// PAGE NAVIGATION
// =====================================

const pageInfo = {
    dashboard: ["Device Overview", "Monitor your IoT device in one place"],
    gps: ["GPS Tracking", "Monitor device location and coordinates"],
    gsm: ["GSM Monitoring", "Network connectivity and signal information"],
    power: ["Power Analytics", "Monitor battery and power consumption"],
    sms: ["SMS Control", "Compose and simulate device messages"],
    settings: ["Device Settings", "Manage basic dashboard preferences"]
};

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();

        const page = link.dataset.page;

        document.querySelectorAll(".nav-link").forEach(item =>
            item.classList.remove("active")
        );

        document.querySelectorAll(".page").forEach(item =>
            item.classList.remove("active")
        );

        link.classList.add("active");
        $(page).classList.add("active");

        $("pageTitle").textContent = pageInfo[page][0];
        $("pageSubtitle").textContent = pageInfo[page][1];

        closeSidebar();

        if (page === "gps") {
            setTimeout(() => {
                initMap();
                if (map) map.invalidateSize();
            }, 150);
        }

        if (page === "power") {
            setTimeout(() => powerChart?.resize(), 150);
        }
    });
});

// =====================================
// SERIAL MONITOR
// =====================================

const terminalLines = [
    ["AT", "cmd"],
    ["OK", "ok"],
    ["AT+CPIN?", "cmd"],
    ["+CPIN: READY", "res"],
    ["AT+CSQ", "cmd"],
    ["+CSQ: 18,0", "res"],
    ["AT+CREG?", "cmd"],
    ["+CREG: 0,1", "res"],
    ["AT+CMGF=1", "cmd"],
    ["OK", "ok"]
];

function renderTerminal() {
    $("terminal").innerHTML = "";

    terminalLines.forEach(([message, type]) => {
        const line = document.createElement("div");

        line.textContent = (type === "cmd" ? "> " : "") + message;
        line.className = type;

        $("terminal").appendChild(line);
    });
}

renderTerminal();

$("clearTerminal").addEventListener("click", () => {
    $("terminal").innerHTML = "> Terminal cleared";
});

// =====================================
// LIVE SIMULATED DATA
// =====================================

function updateLiveData(force = false) {

    if (!force && !$("autoRefresh").checked) return;

    battery += Math.random() > 0.65 ? -1 : 0;

    if (battery <= 20) battery = DEFAULT_BATTERY;

    signal = -70 - Math.floor(Math.random() * 30);

    updateMetrics();
}

// =====================================
// UPDATE ALL METRICS
// =====================================

function updateMetrics() {

    const signalPercent = Math.max(5, Math.min(100,
        ((signal + 110) / 40) * 100
    ));

    const voltage = (3.5 + battery / 100 * 0.8).toFixed(2);

    $("batteryValue").textContent = battery + "%";
    $("powerBattery").textContent = battery + "%";
    $("batteryBar").style.width = battery + "%";

    $("signalValue").textContent = signal + " dBm";
    $("gsmSignal").textContent = signal + " dBm";

    $("signalBar").style.width = signalPercent + "%";
    $("gsmBar").style.width = signalPercent + "%";

    const quality = signal > -80 ? "Good" :
                    signal > -95 ? "Moderate" : "Weak";

    $("signalQuality").textContent = quality;

    $("voltageValue").textContent = "Voltage: " + voltage + "V";
    $("powerVoltage").textContent = voltage + "V";
}

setInterval(() => updateLiveData(), 5000);

// =====================================
// UPTIME
// =====================================

setInterval(() => {

    uptime++;

    const hours = Math.floor(uptime / 60);
    const minutes = uptime % 60;

    $("uptime").textContent = `${hours}h ${minutes}m`;

}, 60000);

// =====================================
// GPS MAP
// =====================================

function initMap() {

    if (map || !window.L) return;

    const location = [20.2961, 85.8245];

    map = L.map("map").setView(location, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(location).addTo(map);

    marker.bindPopup("CoreIoT Device Location (Demo)").openPopup();
}

// =====================================
// POWER CHART
// =====================================

function initChart() {

    const canvas = $("powerChart");

    if (!canvas || !window.Chart || powerChart) return;

    powerChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: ["10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM"],

            datasets: [{
                label: "Battery Level",
                data: [95, 92, 89, 87, 85, battery],
                borderColor: "#21d4fd",
                backgroundColor: "rgba(33,212,253,0.10)",
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: { color: "#91a1bb" }
                }
            },

            scales: {
                x: {
                    ticks: { color: "#91a1bb" },
                    grid: { color: "rgba(255,255,255,.05)" }
                },

                y: {
                    min: 0,
                    max: 100,
                    ticks: { color: "#91a1bb" },
                    grid: { color: "rgba(255,255,255,.05)" }
                }
            }
        }
    });
}

initChart();

// =====================================
// SMS SIMULATION
// =====================================

$("smsMessage").addEventListener("input", () => {

    $("charCount").textContent =
        $("smsMessage").value.length + " / 160 characters";

});

$("smsForm").addEventListener("submit", e => {

    e.preventDefault();

    const phone = $("phoneNumber").value.trim();
    const message = $("smsMessage").value.trim();

    if (!phone || !message) return;

    if (message.length > 160) {
        $("smsFeedback").textContent =
            "Message cannot exceed 160 characters.";
        return;
    }

    const item = document.createElement("div");
    item.className = "sms-item";

    const number = document.createElement("strong");
    number.textContent = phone;

    const content = document.createElement("p");
    content.textContent = message;

    const status = document.createElement("small");
    status.textContent = "Demo message created · Not actually sent";

    item.append(number, content, status);

    const history = $("smsHistory");

    if (history.classList.contains("empty-state")) {
        history.innerHTML = "";
        history.classList.remove("empty-state");
    }

    history.prepend(item);

    $("smsFeedback").textContent =
        "Demo message created successfully. No SMS was sent.";

    $("smsForm").reset();
    $("charCount").textContent = "0 / 160 characters";

});

// =====================================
// SETTINGS
// =====================================

$("notifications").addEventListener("change", e => {

    $("smsFeedback").textContent = e.target.checked
        ? "Dashboard notifications enabled."
        : "Dashboard notifications disabled.";

});

// =====================================
// RESET DEMO DATA - FIXED
// =====================================

$("resetDemo").addEventListener("click", () => {

    // Reset variables
    battery = DEFAULT_BATTERY;
    signal = DEFAULT_SIGNAL;
    uptime = DEFAULT_UPTIME;

    // Update all dashboard metrics
    updateMetrics();

    // Reset uptime
    $("uptime").textContent = "14h 22m";

    // Reset serial monitor
    renderTerminal();

    // Reset SMS history
    $("smsHistory").innerHTML = "No messages sent yet.";
    $("smsHistory").className = "empty-state";

    // Reset SMS form and character count
    $("smsForm").reset();
    $("charCount").textContent = "0 / 160 characters";

    // Reset feedback
    $("smsFeedback").textContent =
        "Demo data reset successfully.";

    // Reset chart
    if (powerChart) {
        powerChart.data.datasets[0].data = [95, 92, 89, 87, 85, 82];
        powerChart.update();
    }
});
console.log("COREIOT UPDATED SCRIPT LOADED");
document.getElementById("resetDemo").addEventListener("click", function () {
    console.log("RESET BUTTON CLICKED");
    alert("Reset button event is working!");
});