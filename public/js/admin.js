const userContainer = document.getElementById("mainUserTableBody");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const addUserButton = document.getElementById("openAddUserModal");
const modal = document.getElementById("addUserModal");
const closeModalBtn = document.getElementById("closeAddUserModal");
const cancelBtn = document.getElementById("cancelAddUser");
const firstNameForm = document.getElementById("firstName");
const lastNameForm = document.getElementById("lastName");
const emailForm = document.getElementById("email");
const passwordForm = document.getElementById("password");
const roleForm = document.getElementById("role");
const siretForm = document.getElementById("siret");
const userForm = document.getElementById("addUserForm");
const logoutButton = document.getElementById("logout");
const btnActes = document.getElementById("openActList");
const dentisteContainer = document.getElementById("dentisteContainer");
const dentisteTableBody = document.getElementById("dentisteTableBody");
const siretContainer = document.getElementById("siretContainer");
const editUserModal = document.getElementById("editUserModal");
const closeEditModalBtn = document.getElementById("closeEditUserModal");
const cancelEditBtn = document.getElementById("cancelEditUser");
const editUserForm = document.getElementById("editUserForm");
const editFirstName = document.getElementById("editFirstName");
const editLastName = document.getElementById("editLastName");
const editEmail = document.getElementById("editEmail");
const editSiret = document.getElementById("editSiret");
const editSiretContainer = document.getElementById("editSiretContainer");
const rechercheText = document.getElementById("recherche-text");
const selectFilter = document.getElementById("type-filter");
const searchInput = document.getElementById("recherche-text");
const clearSearchBtn = document.getElementById("clear-search");
const adminNameDiv = document.getElementById("adminName");

let currentEditingUserId = null;
let selectedDentisteId = null;

if (!token || role !== "admin" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
} else {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const prenom = payload.firstName || "";
    const nom = payload.lastName || "";
    const role = payload.role || "";
    // Mettre à jour le texte
    adminNameDiv.textContent = `${prenom} ${nom} (${
      role.charAt(0).toUpperCase() + role.slice(1)
    })`;
  } catch (err) {
    console.error("Erreur récupération nom dentiste depuis le token :", err);
  }
}

// Ouvrir la popup
addUserButton.addEventListener("click", () => {
  modal.classList.add("active");
});

// Fermer la popup (X)
closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  userForm.reset();
  siretContainer.classList.add("hidden");
  dentisteTableBody.innerHTML = ""; // vide le tableau des dentistes
  dentisteContainer.classList.add("hidden"); // cache le tableau
  selectedDentisteId = null; // réinitialise la sélection
  roleForm.value = "admin";
});

// Fermer la popup (bouton Annuler)
cancelBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  userForm.reset();
  siretContainer.classList.add("hidden");
  dentisteTableBody.innerHTML = ""; // vide le tableau des dentistes
  dentisteContainer.classList.add("hidden"); // cache le tableau
  selectedDentisteId = null; // réinitialise la sélection
  roleForm.value = "";
});

// Fonction pour ouvrir la modale avec les infos de l'utilisateur
function openEditUserModal(user) {
  currentEditingUserId = user._id;
  editFirstName.value = user.firstName;
  editLastName.value = user.lastName;
  editEmail.value = user.email;
  editSiret.value = user.siret || "";

  if (user.role !== "admin") {
    editSiretContainer.classList.remove("hidden");
  } else {
    editSiretContainer.classList.add("hidden");
  }

  editUserModal.classList.add("active");
}

// Fermer la modale
closeEditModalBtn.addEventListener("click", () =>
  editUserModal.classList.remove("active")
);
cancelEditBtn.addEventListener("click", () =>
  editUserModal.classList.remove("active")
);

// Soumission de la modale
editUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await fetch(`/api/admin/updateUser/${currentEditingUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: editFirstName.value,
        lastName: editLastName.value,
        email: editEmail.value,
        siret: editSiret.value,
      }),
    });

    editUserModal.classList.remove("active");
    chargerUser(); // rafraîchir le tableau
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur", error);
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

async function chargerUser() {
  try {
    const res = await fetch("/api/admin/getUserWithoutAdmin", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    let users = await res.json();
    console.log(users);

    // Récupérer les valeurs des filtres
    const roleFilter = document
      .getElementById("type-filter")
      .value.toLowerCase();
    const searchText = document
      .getElementById("recherche-text")
      .value.toLowerCase();

    // Filtrer les utilisateurs
    users = users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const roleMatch =
        roleFilter === "tous" || roleFilter === ""
          ? true
          : user.role.toLowerCase() === roleFilter;
      const textMatch =
        fullName.includes(searchText) ||
        user.email.toLowerCase().includes(searchText);
      return roleMatch && textMatch;
    });

    userContainer.innerHTML = "";

    for (const user of users) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${
        user.associatedUser
          ? `${user.associatedUser.firstName} ${user.associatedUser.lastName} (${user.associatedUser.role})`
          : ""
      }</td>
      <td class="actions">
        <div>
          <button class="btn-edit" data-user='${JSON.stringify(user)}'>✏️</button>
          <button class="btn-delete" data-id="${user._id}">❌</button>
        </div>
      </td>
  `;

      userContainer.appendChild(tr);
    }

    // Bouton modifier
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const user = JSON.parse(e.currentTarget.dataset.user);
        openEditUserModal(user);
        console.log("Modifier utilisateur", userId);
      });
    });

    // Bouton supprimer
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const userId = e.currentTarget.dataset.id;
        if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
          try {
            await fetch(`/api/user/deleteUser/${userId}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            chargerUser();
          } catch (error) {
            console.error("Erreur suppression utilisateur", error);
          }
        }
      });
    });
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs", error);
  }
}

async function chargerDentistes() {
  try {
    const res = await fetch("/api/admin/getAllDentistes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const dentistes = await res.json();

    const dentistesDispo = dentistes.filter((d) => !d.associatedUser);

    dentisteTableBody.innerHTML = "";

    for (const dentiste of dentistesDispo) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${dentiste.firstName} ${dentiste.lastName}</td>
          <td>${dentiste.email} </td>`;

      tr.dataset = dentiste._id;

      // gestion du clic pour la selection
      tr.addEventListener("click", () => {
        // Supprimer la selection precedente
        document
          .querySelectorAll("#dentisteTableBody tr")
          .forEach((r) => r.classList.remove("selected"));

        // Ajouter la sélection sur cette ligne
        tr.classList.add("selected");

        // Stocker l'id du dentiste
        selectedDentisteId = dentiste._id;
        console.log(selectedDentisteId);
      });
      dentisteTableBody.appendChild(tr);
    }
  } catch (error) {
    console.error("Erreur lors du chargement des dentistes", error);
  }
}

async function addUser(e) {
  try {
    e.preventDefault();

    const res = await fetch("/api/admin/createAccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: firstNameForm.value,
        lastName: lastNameForm.value,
        email: emailForm.value,
        password: passwordForm.value,
        role: roleForm.value,
        siret: siretForm.value,
        dentisteId: selectedDentisteId,
      }),
    });

    modal.classList.remove("active");
    userForm.reset();
    siretContainer.classList.add("hidden");
    dentisteTableBody.innerHTML = ""; // vide le tableau des dentistes
    dentisteContainer.classList.add("hidden"); // cache le tableau
    selectedDentisteId = null; // réinitialise la sélection
    roleForm.value = "Sélectionner un rôle";
    chargerUser();
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateurs", error);
  }
}

function filterTable() {
  const type = selectFilter.value.toLowerCase().trim();
  const searchText = searchInput.value.toLowerCase().trim();
  const rows = userContainer.querySelectorAll("tr");

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0].textContent.toLowerCase().trim();
    const email = cells[1].textContent.toLowerCase().trim();
    const role = cells[2].textContent.toLowerCase().trim();

    let typeMatch = true;
    let textMatch = true;

    // Si un rôle est sélectionné autre que "all"
    if (type !== "Tous") {
      typeMatch = role === type;
    }

    // Si un texte est saisi
    if (searchText !== "") {
      textMatch =
        name.includes(searchText) ||
        email.includes(searchText) ||
        role.includes(searchText);
    }

    // Si les deux filtres sont actifs, les deux doivent être vrais
    row.style.display = typeMatch && textMatch ? "" : "none";
  });
}

btnActes.addEventListener("click", () => {
  window.location.href = "listeActes.html";
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

roleForm.addEventListener("change", () => {
  siretContainer.classList.add("hidden");

  if (roleForm.value == "prothesiste") {
    siretContainer.classList.remove("hidden");
    dentisteContainer.classList.remove("hidden");
    chargerDentistes();
  } else if (roleForm.value == "dentiste") {
    siretContainer.classList.remove("hidden");
    dentisteContainer.classList.add("hidden");
    dentisteTableBody.innerHTML = "";
    selectedDentisteId = null;
  } else if (roleForm.value == "admin") {
    siretContainer.classList.add("hidden");
    dentisteContainer.classList.add("hidden");
    dentisteTableBody.innerHTML = "";
  }
});

selectFilter.addEventListener("change", chargerUser);
searchInput.addEventListener("input", chargerUser);
userForm.addEventListener("submit", addUser);
chargerUser();
