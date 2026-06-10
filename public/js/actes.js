const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const acteContainer = document.getElementById("acteTableBody");
const btnBackAdmin = document.getElementById("backAdmin");
const acteNameForm = document.getElementById("acteName");
const acteDescrForm = document.getElementById("acteDescr");
const acteForm = document.getElementById("acteForm");
const addActeButton = document.getElementById("openActeModal");
const closeModalBtn = document.getElementById("closeActeModal");
const cancelBtn = document.getElementById("cancelActe");
const modal = document.getElementById("acteModal");
const modalTitle = document.getElementById("acteModalTitle");
const logoutButton = document.getElementById("logout");

let currentEditingActeId = null;

if (!token || role !== "admin" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
}

// Messages dans la modale
function showActeModalMessage(msg, type = "error", duration = 4000) {
  let messageDiv = document.getElementById("acteMessage");
  if (!messageDiv) {
    messageDiv = document.createElement("div");
    messageDiv.id = "acteMessage";
    messageDiv.className = "message-modal";
    modal.querySelector(".modal-content").prepend(messageDiv);
  }

  messageDiv.textContent = msg;
  messageDiv.className = "message-modal"; // reset
  messageDiv.classList.add(type === "success" ? "success" : "error");
  messageDiv.style.display = "block";

  setTimeout(() => { messageDiv.style.display = "none"; }, duration);
}

// Messages globaux au-dessus de la table
function showActeGlobalMessage(msg, type = "error", duration = 4000) {
  let messageDiv = document.getElementById("acteGlobalMessage");
  if (!messageDiv) {
    messageDiv = document.createElement("div");
    messageDiv.id = "acteGlobalMessage";
    messageDiv.className = "message-system";
    acteContainer.parentElement.prepend(messageDiv);
  }

  messageDiv.textContent = msg;
  messageDiv.className = "message-system"; // reset
  messageDiv.classList.add(type === "success" ? "success" : "error");
  messageDiv.style.display = "block";

  setTimeout(() => { messageDiv.style.display = "none"; }, duration);
}

// Ouvrir la popup
addActeButton.addEventListener("click", () => {
  currentEditingActeId = null; // Mode Creation
  acteForm.reset();
  modalTitle.textContent = "Créer un acte";
  modal.classList.add("active");
});

// Fermer la popup (X)
closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  acteForm.reset();
  currentEditingActeId = null;
});

// Fermer la popup (bouton Annuler)
cancelBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  acteForm.reset();
  currentEditingActeId = null;
});

// Fonction pour ouvrir la modale avec les infos de l'acte
function openEditActeModal(acte) {
  currentEditingActeId = acte._id; // Mode Edition
  acteNameForm.value = acte.acteName;
  acteDescrForm.value = acte.acteDescription;
  modalTitle.textContent = "Modifier l’acte";
  modal.classList.add("active");
}

// Soumission de la modale
acteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      acteName: acteNameForm.value.trim(),
      acteDescription: acteDescrForm.value.trim(),
    };

    let res;
    if (currentEditingActeId) {
      res = await fetch(`/api/admin/updateActe/${currentEditingActeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/admin/createActe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      // Ici on récupère le message d'erreur envoyé par l'API
      showActeModalMessage(data.message || "Erreur lors de l'enregistrement", "error");
      return;
    }

    // Succès
    showActeModalMessage("Acte enregistré avec succès !", "success");
    showActeGlobalMessage(currentEditingActeId ? "Acte modifié avec succès !" : "Acte ajouté avec succès !", "success");

    setTimeout(() => {
      modal.classList.remove("active");
      acteForm.reset();
      currentEditingActeId = null;
      chargerActes();
    }, 500);

  } catch (error) {
    console.error(error);
    showActeModalMessage(error.message || "Erreur inattendue", "error");
  }
});

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; // token invalide
  }
}

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

async function chargerActes() {
  try {
    const res = await fetch("/api/admin/getAllActes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const actes = await res.json();
    acteContainer.innerHTML = "";

    for (const acte of actes) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${acte.acteName}</td>
        <td>${acte.acteDescription}</td>
        <td class="actions">
          <div>
            <button class="btn-edit" data-acte='${JSON.stringify(acte)}'>✏️</button>
            <button class="btn-delete" data-id="${acte._id}">❌</button>
          </div>
        </td>`;

      acteContainer.appendChild(tr);
    }

    // Bouton modifier
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const acte = JSON.parse(e.currentTarget.dataset.acte);
        openEditActeModal(acte);
      });
    });

    // Bouton supprimer
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const acteId = e.currentTarget.dataset.id;
        if (!confirm("Voulez-vous vraiment supprimer cet acte ?")) return;

        try {
          const res = await fetch(`/api/admin/deleteActe/${acteId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Erreur lors de la suppression");

          showActeGlobalMessage("Acte supprimé avec succès !", "success");
          chargerActes();

        } catch (error) {
          console.error(error);
          showActeGlobalMessage(error.message || "Erreur inattendue", "error");
        }
      });
    });

  } catch (error) {
    console.error("Erreur lors du chargement des actes", error);
    showActeGlobalMessage("Erreur lors du chargement des actes", "error");
  }
}

btnBackAdmin.addEventListener("click", () => {
  window.location.href = "admin.html";
});

chargerActes();