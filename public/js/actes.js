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

let currentEditingActeId = null;

if (!token || role !== "admin" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
}

// Ouvrir la popup
addActeButton.addEventListener("click", () => {
  currentEditingActeId = null; // Mode Creation
  acteForm.reset();
  modalTitle.textContent = currentEditingActeId
    ? "Modifier l’acte"
    : "Créer un acte";
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
  modalTitle.textContent = currentEditingActeId
    ? "Modifier l’acte"
    : "Créer un acte";

  modal.classList.add("active");
}

// Soumission de la modale
acteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      acteName: acteNameForm.value,
      acteDescription: acteDescrForm.value,
    };

    if (currentEditingActeId) {
      await fetch(`/api/admin/updateActe/${currentEditingActeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/createActe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }
    modal.classList.remove("active");
    chargerActes();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'acte", error);
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
        
      <td>
        <button class="btn-edit" data-acte='${JSON.stringify(acte)}'>✏️</button>
        <button class="btn-delete" data-id="${acte._id}">❌</button>
      </td>`;

      acteContainer.appendChild(tr);
    }

    // Bouton modifier
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const acte = JSON.parse(e.currentTarget.dataset.acte);
        openEditActeModal(acte);
      });
    });

    // Bouton supprimer
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const acteId = e.currentTarget.dataset.id;
        if (confirm("Voulez-vous vraiment supprimer cet acte ?")) {
          try {
            await fetch(`/api/admin/deleteActe/${acteId}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            chargerActes();
          } catch (error) {
            console.error("Erreur suppression acte", error);
          }
        }
      });
    });
  } catch (error) {
    console.error("Erreur lors du chargement des actes", error);
  }
}

/*async function addActe(e) {
  try {
    e.preventDefault();

    const res = await fetch("/api/admin/createActe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        acteName: acteNameForm.value,
        acteDescription: acteDescrForm.value,
      }),
    });

    modal.classList.remove("active");
    acteForm.reset();
    chargerActes();
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'acte", error);
  }
}*/

btnBackAdmin.addEventListener("click", () => {
  window.location.href = "admin.html";
});

//acteForm.addEventListener("submit", addActe);
chargerActes();
