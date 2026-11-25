// ==========================================
// FINDIT - SMART LOST AND FOUND SYSTEM
// ==========================================

// LOCAL STORAGE
const ITEMS_KEY = "findit_simple_items";
const CLAIMS_KEY = "findit_simple_claims";
const HISTORY_KEY = "findit_simple_history";

let items = JSON.parse(localStorage.getItem(ITEMS_KEY)) || [];
let claims = JSON.parse(localStorage.getItem(CLAIMS_KEY)) || [];
let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

// SAVE DATA
function saveData() {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// TOAST NOTIFICATION
function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// NAVIGATION
const pageTitles = {
    dashboard: "Dashboard",
    browse: "Browse Items",
    report: "Report Item",
    matches: "Possible Matches",
    claims: "Claim Requests"
};

const pageSubtitles = {
    dashboard: "Welcome back! Here's what's happening today.",
    browse: "Explore all reported lost and found belongings.",
    report: "Provide the details of the item you want to report.",
    matches: "Review items that may be related to one another.",
    claims: "Review submitted claim requests."
};

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageName);

    if (!selectedPage) return;

    selectedPage.classList.add("active");

    const activeLink = document.querySelector(
        `.nav-link[data-page="${pageName}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

    document.getElementById("pageTitle").textContent =
        pageTitles[pageName] || "FindIt";

    document.getElementById("pageSubtitle").textContent =
        pageSubtitles[pageName] || "";

    refreshSystem();
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// HISTORY
function addHistory(message) {
    history.unshift({
        message,
        date: new Date().toLocaleString()
    });

    history = history.slice(0, 30);
    saveData();
}

// DATE FORMAT
function formatDate(date) {
    if (!date) return "No date";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// EMPTY STATE
function emptyState(title, message) {
    return `
        <div class="empty-state">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;
}

// ESCAPE HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

// ITEM CARD
function itemCard(item, showActions = true) {
    const status = String(item.status || item.type || "Lost");
    const statusClass = status.toLowerCase() === "found"
        ? "found"
        : status.toLowerCase() === "returned"
            ? "returned"
            : "lost";

    const imageHTML = item.image
        ? `<img src="${item.image}" alt="${escapeHTML(item.name)}">`
        : `<span>▧</span>`;

    const actionHTML = showActions
        ? `
            <div class="item-actions">
                <button onclick="requestClaim('${item.id}')">Claim item</button>
                <button onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        `
        : "";

    return `
        <article class="item-card">
            <div class="item-image">${imageHTML}</div>

            <div class="item-info">
                <h3>${escapeHTML(item.name)}</h3>
                <p>${escapeHTML(item.description)}</p>

                <div class="item-meta">
                    <span>▦ ${escapeHTML(item.category)}</span>
                    <span>⌖ ${escapeHTML(item.location)}</span>
                    <span>◷ ${formatDate(item.date)}</span>
                </div>
            </div>

            <span class="item-status ${statusClass}">
                ${escapeHTML(status)}
            </span>

            ${actionHTML}
        </article>
    `;
}

// DASHBOARD
function updateDashboard() {
    document.getElementById("totalReports").textContent = items.length;

    document.getElementById("lostCount").textContent =
        items.filter(item =>
            String(item.status || item.type).toLowerCase() === "lost"
        ).length;

    document.getElementById("foundCount").textContent =
        items.filter(item =>
            String(item.status || item.type).toLowerCase() === "found"
        ).length;

    document.getElementById("returnedCount").textContent =
        items.filter(item =>
            String(item.status || "").toLowerCase() === "returned"
        ).length;

    const recentReports = document.getElementById("recentReports");

    const recentItems = [...items].reverse().slice(0, 5);

    recentReports.innerHTML = recentItems.length
        ? recentItems.map(item => itemCard(item, false)).join("")
        : emptyState(
            "No reports yet",
            "Submitted lost and found items will appear here."
        );

    const recentActivity = document.getElementById("recentActivity");

    recentActivity.innerHTML = history.length
        ? history.slice(0, 6).map(activity => `
            <div class="activity-item">
                <span class="activity-icon">✦</span>
                <div>
                    <p>${escapeHTML(activity.message)}</p>
                    <small>${escapeHTML(activity.date)}</small>
                </div>
            </div>
        `).join("")
        : emptyState(
            "No recent activity",
            "Your latest actions will appear here."
        );
}

// BROWSE ITEMS
function updateBrowse() {
    const searchInput = document.getElementById("searchItems");
    const filterInput = document.getElementById("itemFilter");

    const search = searchInput.value.toLowerCase().trim();
    const filter = filterInput.value;

    const filteredItems = items.filter(item => {
        const searchableText = [
            item.name,
            item.category,
            item.description,
            item.color,
            item.brand,
            item.location
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const status = String(item.status || item.type || "").toLowerCase();

        const matchesFilter =
            filter === "all" ||
            status === filter.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    document.getElementById("browseCount").textContent =
        `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""} found`;

    document.getElementById("allItems").innerHTML =
        filteredItems.length
            ? filteredItems.map(item => itemCard(item)).join("")
            : emptyState(
                "No items found",
                "Try another search or change the selected filter."
            );
}

document.getElementById("searchItems").addEventListener("input", updateBrowse);
document.getElementById("itemFilter").addEventListener("change", updateBrowse);

// SIMILARITY MATCHING
function similarity(value1, value2) {
    if (!value1 || !value2) return 0;

    const first = String(value1).toLowerCase().trim();
    const second = String(value2).toLowerCase().trim();

    if (first === second) return 1;

    const words1 = first.split(/\s+/);
    const words2 = second.split(/\s+/);

    const commonWords = words1.filter(word =>
        words2.includes(word)
    );

    const uniqueWords = new Set([...words1, ...words2]);

    return uniqueWords.size
        ? commonWords.length / uniqueWords.size
        : 0;
}

// MATCH SCORE
function matchScore(lost, found) {
    let score = 0;

    score += similarity(lost.name, found.name) * 25;
    score += similarity(lost.category, found.category) * 20;
    score += similarity(lost.color, found.color) * 15;
    score += similarity(lost.brand, found.brand) * 10;
    score += similarity(lost.description, found.description) * 15;
    score += similarity(lost.location, found.location) * 10;
    score += similarity(lost.date, found.date) * 5;

    return Math.round(score);
}

// POSSIBLE MATCHES
function updateMatches() {
    const matchList = document.getElementById("matchList");

    const lostItems = items.filter(item =>
        String(item.status || item.type).toLowerCase() === "lost"
    );

    const foundItems = items.filter(item =>
        String(item.status || item.type).toLowerCase() === "found"
    );

    const matches = [];

    lostItems.forEach(lost => {
        foundItems.forEach(found => {
            const score = matchScore(lost, found);

            if (score >= 40) {
                matches.push({
                    lost,
                    found,
                    score
                });
            }
        });
    });

    matches.sort((a, b) => b.score - a.score);

    matchList.innerHTML = matches.length
        ? matches.map(match => `
            <article class="item-card">
                <div class="item-info">
                    <span class="item-status lost">Lost report</span>
                    <h3>${escapeHTML(match.lost.name)}</h3>
                    <p>${escapeHTML(match.lost.description)}</p>
                    <div class="item-meta">
                        <span>⌖ ${escapeHTML(match.lost.location)}</span>
                    </div>
                </div>

                <div class="item-info">
                    <span class="item-status found">Found report</span>
                    <h3>${escapeHTML(match.found.name)}</h3>
                    <p>${escapeHTML(match.found.description)}</p>
                    <div class="item-meta">
                        <span>⌖ ${escapeHTML(match.found.location)}</span>
                    </div>
                </div>

                <span class="item-status">
                    ${match.score}% match
                </span>
            </article>
        `).join("")
        : emptyState(
            "No possible matches yet",
            "FindIt will display possible matches when similar lost and found reports are available."
        );
}

// CLAIM REQUEST
function requestClaim(itemId) {
    const item = items.find(entry => String(entry.id) === String(itemId));

    if (!item) return;

    if (String(item.status || item.type).toLowerCase() !== "found") {
        showToast("Only found items can receive claim requests.");
        return;
    }

    const claimantName = prompt("Enter your full name:");

    if (claimantName === null) return;

    if (claimantName.trim().length < 2) {
        showToast("Please enter a valid name.");
        return;
    }

    const contact = prompt("Enter your contact information:");

    if (contact === null) return;

    if (contact.trim().length < 7) {
        showToast("Please enter valid contact information.");
        return;
    }

    const proof = prompt(
        "Provide details that can help verify your ownership:"
    );

    if (proof === null) return;

    if (proof.trim().length < 10) {
        showToast("Please provide more ownership details.");
        return;
    }

    const possibleMatches = items
        .filter(entry =>
            String(entry.status || entry.type).toLowerCase() === "found"
        )
        .map(entry => ({
            item: entry,
            score: matchScore(item, entry)
        }))
        .filter(result => result.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const newClaim = {
        id: Date.now(),
        itemId: item.id,
        itemName: item.name,
        claimantName: claimantName.trim(),
        contact: contact.trim(),
        proof: proof.trim(),
        matches: possibleMatches.map(result => ({
            itemId: result.item.id,
            score: result.score
        })),
        status: possibleMatches.length ? "Matched" : "Unmatched",
        date: new Date().toLocaleString()
    };

    claims.push(newClaim);

    addHistory(
        `${claimantName.trim()} submitted a claim request for ${item.name}.`
    );

    saveData();
    refreshSystem();

    showToast("Claim request submitted successfully.");
}

// CLAIMS DISPLAY
// CLAIMS DISPLAY
function updateClaims() {
    const claimList = document.getElementById("claimList");

    claimList.innerHTML = claims.length
        ? [...claims].reverse().map(claim => `
            <article class="item-card">
                <div class="item-info">
                    <h3>${escapeHTML(claim.itemName || "Unknown item")}</h3>
                    <p>Claimant: ${escapeHTML(claim.claimantName)}</p>
                    <p>Contact: ${escapeHTML(claim.contact)}</p>
                    <p>Proof: ${escapeHTML(claim.proof)}</p>

                    <div class="item-meta">
                        <span>◷ ${escapeHTML(claim.date)}</span>
                        <span>${(claim.matches || []).length} possible match(es)</span>
                    </div>
                </div>

                <span class="item-status ${
                    claim.status === "Approved" ? "found" :
                    claim.status === "Rejected" ? "lost" : ""
                }">
                    ${escapeHTML(claim.status)}
                </span>

                ${
                    claim.status !== "Approved" &&
                    claim.status !== "Rejected"
                    ? `
                        <div class="item-actions">
                            <button onclick="approveClaim('${claim.id}')">
                                Approve
                            </button>

                            <button onclick="rejectClaim('${claim.id}')">
                                Reject
                            </button>
                        </div>
                    `
                    : ""
                }
            </article>
        `).join("")
        : emptyState(
            "No claim requests",
            "Submitted claim requests will appear here."
        );
}

// APPROVE CLAIM
function approveClaim(claimId) {
    const claim = claims.find(
        entry => String(entry.id) === String(claimId)
    );

    if (!claim) return;

    const confirmed = confirm(
        `Are you sure you want to approve ${claim.claimantName}'s claim?`
    );

    if (!confirmed) return;

    claim.status = "Approved";

    // Mark the claimed item as returned
    const item = items.find(
        entry => String(entry.id) === String(claim.itemId)
    );

    if (item) {
        item.status = "Returned";
    }

    addHistory(
        `Approved ${claim.claimantName}'s claim for ${claim.itemName}.`
    );

    saveData();
    refreshSystem();

    showToast("Claim request approved successfully.");
}

// REJECT CLAIM
function rejectClaim(claimId) {
    const claim = claims.find(
        entry => String(entry.id) === String(claimId)
    );

    if (!claim) return;

    const confirmed = confirm(
        `Are you sure you want to reject ${claim.claimantName}'s claim?`
    );

    if (!confirmed) return;

    claim.status = "Rejected";

    addHistory(
        `Rejected ${claim.claimantName}'s claim for ${claim.itemName}.`
    );

    saveData();
    refreshSystem();

    showToast("Claim request rejected.");
}

// DELETE ITEM
function deleteItem(itemId) {
    const item = items.find(entry => String(entry.id) === String(itemId));

    if (!item) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    items = items.filter(entry =>
        String(entry.id) !== String(itemId)
    );

    addHistory(`Deleted the report for ${item.name}.`);

    saveData();
    refreshSystem();

    showToast("Report deleted successfully.");
}

// REPORT FORM
const reportForm = document.getElementById("reportForm");

reportForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const imageInput = document.getElementById("itemImage");
    const file = imageInput.files[0];

    if (file && file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        return;
    }

    const reportData = {
        id: Date.now(),
        type: document.getElementById("reportType").value,
        status: document.getElementById("reportType").value,
        name: document.getElementById("itemName").value.trim(),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim(),
        color: document.getElementById("color").value.trim(),
        brand: document.getElementById("brand").value.trim(),
        location: document.getElementById("location").value.trim(),
        date: document.getElementById("itemDate").value,
        contact: document.getElementById("contact").value.trim(),
        image: ""
    };

    if (file) {
        const reader = new FileReader();

        reader.onload = function() {
            reportData.image = reader.result;
            saveReport(reportData);
        };

        reader.onerror = function() {
            showToast("Unable to read the selected image.");
        };

        reader.readAsDataURL(file);
    } else {
        saveReport(reportData);
    }
});

// SAVE REPORT
function saveReport(reportData) {
    items.push(reportData);

    addHistory(
        `A new ${reportData.type} item was reported: ${reportData.name}.`
    );

    saveData();
    reportForm.reset();

    const preview = document.getElementById("imagePreview");
    preview.innerHTML = "";
    preview.style.display = "none";

    refreshSystem();
    showPage("dashboard");

    showToast("Your report has been submitted successfully.");
}

// IMAGE PREVIEW
document.getElementById("itemImage").addEventListener("change", function() {
    const preview = document.getElementById("imagePreview");
    const file = this.files[0];

    preview.innerHTML = "";

    if (!file) {
        preview.style.display = "none";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image.");
        this.value = "";
        preview.style.display = "none";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        this.value = "";
        preview.style.display = "none";
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        preview.innerHTML = `
            <img src="${reader.result}" alt="Selected item preview">
        `;

        preview.style.display = "block";
    };

    reader.readAsDataURL(file);
});

// CLEAR IMAGE PREVIEW WHEN FORM IS RESET
reportForm.addEventListener("reset", function() {
    setTimeout(() => {
        const preview = document.getElementById("imagePreview");

        preview.innerHTML = "";
        preview.style.display = "none";
    }, 0);
});

// REFRESH SYSTEM
function refreshSystem() {
    updateDashboard();
    updateBrowse();
    updateMatches();
    updateClaims();
}

// INITIALIZE
refreshSystem();
