document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCards = new Map();
  const activityDetails = new Map();

  function renderParticipants(activityCard, activityName, details) {
    const participantsHeading = activityCard.querySelector(".participants-heading");
    const participantsList = activityCard.querySelector(".participants-list");
    participantsHeading.textContent = `Participants (${details.participants.length})`;
    participantsList.replaceChildren();

    if (details.participants.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "participants-empty";
      emptyItem.textContent = "No participants yet";
      participantsList.appendChild(emptyItem);
      return;
    }

    details.participants.forEach((participant) => {
      const listItem = document.createElement("li");
      listItem.className = "participant-row";

      const participantName = document.createElement("span");
      participantName.className = "participant-name";
      participantName.textContent = participant;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-participant";
      removeButton.title = "Unregister participant";
      removeButton.setAttribute("aria-label", `Unregister ${participant} from ${activityName}`);
      removeButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
        </svg>
      `;
      removeButton.addEventListener("click", async () => {
        removeButton.disabled = true;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participant)}`,
            { method: "DELETE" }
          );
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Could not unregister participant.");
          }

          details.participants = details.participants.filter((email) => email !== participant);
          activityCard.querySelector(".spots-left").textContent =
            `${details.max_participants - details.participants.length} spots left`;
          renderParticipants(activityCard, activityName, details);
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
        } catch (error) {
          messageDiv.textContent = error.message || "Failed to unregister participant.";
          messageDiv.className = "error";
          removeButton.disabled = false;
        }

        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      });

      listItem.append(participantName, removeButton);
      participantsList.appendChild(listItem);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activityCards.clear();
      activityDetails.clear();

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft} spots left</span></p>
        `;

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        activityCard.append(participantsHeading, participantsList);
        renderParticipants(activityCard, name, details);

        activitiesList.appendChild(activityCard);
        activityCards.set(name, activityCard);
        activityDetails.set(name, details);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        const activityCard = activityCards.get(activity);
        const details = activityDetails.get(activity);
        if (activityCard && details) {
          details.participants.push(email);
          activityCard.querySelector(".spots-left").textContent =
            `${details.max_participants - details.participants.length} spots left`;
          renderParticipants(activityCard, activity, details);
        }

        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
