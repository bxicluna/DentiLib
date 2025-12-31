const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const logoutButton = document.getElementById("logout");
const acteSelect = document.getElementById("acteSelect");
const addBtn = document.getElementById("addActeBtn");
const priceInput = document.getElementById("actePrice");
const tableBody = document.getElementById("catalogTableBody");
const btnHome = document.getElementById("home");
const messageSystem = document.getElementById("messageSystem");

if (!token || role !== "prothesiste" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  showMessage("Session expirée, veuillez vous reconnecter");

  setTimeout(() => {
    window.location.href = "/login.html";
  }, 1500);
} 

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; // token invalide
  }
}

function showMessage(text, type = "error") {
  messageSystem.textContent = text;
  messageSystem.style.display = "block";

  if (type === "error") {
    messageSystem.classList.remove("success");
    messageSystem.style.color = "red";
  } else {
    messageSystem.classList.add("success");
    messageSystem.style.color = "green";
  }

  // Optionnel : disparaît après 3 secondes
  setTimeout(() => {
    messageSystem.style.display = "none";
  }, 3000);
}


// Bouton Fiches travaux
btnHome.addEventListener("click", () => {
    window.location.href = "/prothesiste.html"
})

async function loadCatalogueActes() {
  try {
    const res = await fetch("/api/admin/getAllActes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.clear();
      showMessage("Session expirée, veuillez vous reconnecter");
      setTimeout(() => window.location.href = "/login.html", 1500);
      return;
    }

    if (!res.ok) {
      let errorMsg = "Erreur lors du chargement des actes";
      try {
        const data = await res.json();
        errorMsg = data.message || errorMsg;
      } catch {}
      showMessage(errorMsg);
      return;
    }

    const actes = await res.json();
    acteSelect.innerHTML = `<option value="">-- Choisir un acte --</option>`;
    actes.forEach(acte => {
      const option = document.createElement("option");
      option.value = acte.acteName;
      option.textContent = acte.acteName;
      acteSelect.appendChild(option);
    });

  } catch (err) {
    console.error(err);
    showMessage("Erreur serveur, veuillez réessayer plus tard");
  }
}

async function loadProthesistActes() {
  const res = await fetch("/api/acte/getMyActes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const actes = await res.json();

  tableBody.innerHTML = "";

  if (actes.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;color:#9ca3af;">
          Aucun acte dans votre catalogue
        </td>
      </tr>
    `;
    return;
  }

  actes.forEach((acteItem) => {

    if(!acteItem.acte) {
        console.warn("Acte non populé: ", acteItem)
        return
    }
    const tr = document.createElement("tr");

    tr.innerHTML = `<td>${acteItem.acte.acteName}</td>
      <td>
        <input 
          type="number"
          class="price-input"
          value="${acteItem.price}"
          data-id="${acteItem._id}"
        />
      </td>
      <td>
        <button class="btn-edit" data-id="${acteItem._id}">💾</button>
        <button class="btn-delete" data-id="${acteItem._id}">❌</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

addBtn.addEventListener("click", async () => {
  const acteName = acteSelect.value;
  const price = priceInput.value;

  if (!acteName || !price) {
    showMessage("Merci de choisir un acte et un prix");
    return;
  }

  try {
    const res = await fetch("/api/acte/addActe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ acteName, price }),
    });

    if (res.status === 401) {
      localStorage.clear();
      showMessage("Session expirée, veuillez vous reconnecter");
      setTimeout(() => window.location.href = "/login.html", 1500);
      return;
    }

    if (!res.ok) {
      let errorMsg = "Impossible d’ajouter l’acte";
      try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
      showMessage(errorMsg);
      return;
    }

    showMessage("Acte ajouté avec succès", "success");
    priceInput.value = "";
    acteSelect.innerHTML = `<option value="">-- Choisir un acte --</option>`;
    await loadCatalogueActes();
    loadProthesistActes();

  } catch (err) {
    console.error(err);
    showMessage("Erreur serveur, veuillez réessayer plus tard");
  }
});

tableBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-edit")) return;

  const acteListId = e.target.dataset.id;
  const input = document.querySelector(`input[data-id="${acteListId}"]`);
  const price = input.value;

  try {
    const res = await fetch(`/api/acte/updateActe/${acteListId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price }),
    });

    if (res.status === 401) {
      localStorage.clear();
      showMessage("Session expirée, veuillez vous reconnecter");
      setTimeout(() => window.location.href = "/login.html", 1500);
      return;
    }

    if (!res.ok) {
      let errorMsg = "Impossible de modifier le prix";
      try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
      showMessage(errorMsg);
      await loadProthesistActes();
      return;
    }

    showMessage("Prix mis à jour avec succès", "success");
    await loadProthesistActes(); // refresh tableau

  } catch (err) {
    console.error(err);
    showMessage("Erreur serveur, veuillez réessayer plus tard");
  }
});

tableBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-delete")) return;

  const acteListId = e.target.dataset.id;

  if (!confirm("Supprimer cet acte de votre catalogue ?")) return;

  try {
    const res = await fetch(`/api/acte/deleteActe/${acteListId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      showMessage("Session expirée, veuillez vous reconnecter");
      setTimeout(() => window.location.href = "/login.html", 1500);
      return;
    }

    if (!res.ok) {
      let errorMsg = "Impossible de supprimer l’acte";
      try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
      showMessage(errorMsg);
      return;
    }

    showMessage("Acte supprimé avec succès", "success");
    await loadProthesistActes(); // refresh tableau
    await loadCatalogueActes();  // refresh liste déroulante

  } catch (err) {
    console.error(err);
    showMessage("Erreur serveur, veuillez réessayer plus tard");
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  loadCatalogueActes()
  loadProthesistActes();
});
