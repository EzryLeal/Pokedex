class PokemonApp {
  constructor() {
    this.pokemonList = []
    this.filteredPokemon = []
    this.favorites = JSON.parse(localStorage.getItem("pokemonFavorites")) || []
    this.currentFilter = null
    this.showingFavorites = false
    this.currentPage = 0
    this.pokemonPerPage = 20

    this.init()
  }

  async init() {
    this.bindEvents()
    await this.loadPokemonTypes()
    await this.loadPokemon()
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById("searchInput")
    const searchButton = document.getElementById("searchButton")

    searchButton.addEventListener("click", () => this.handleSearch())
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch()
      }
    })

    // Favorites toggle
    const favoritesToggle = document.getElementById("favoritesToggle")
    favoritesToggle.addEventListener("click", () => this.toggleFavorites())

    // Modal events
    const modalOverlay = document.getElementById("modalOverlay")
    const modalClose = document.getElementById("modalClose")

    modalOverlay.addEventListener("click", () => this.closeModal())
    modalClose.addEventListener("click", () => this.closeModal())

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
      }
    })
  }

  async loadPokemonTypes() {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/type")
      const data = await response.json()

      const typeFilters = document.getElementById("typeFilters")

      // Add "All" filter
      const allFilter = document.createElement("button")
      allFilter.className = "filter-type filter-type--active"
      allFilter.textContent = "Todos"
      allFilter.addEventListener("click", () => this.filterByType(null))
      typeFilters.appendChild(allFilter)

      // Add type filters
      data.results.forEach((type) => {
        const filterButton = document.createElement("button")
        filterButton.className = "filter-type"
        filterButton.textContent = this.translateType(type.name)
        filterButton.addEventListener("click", () => this.filterByType(type.name))
        typeFilters.appendChild(filterButton)
      })
    } catch (error) {
      console.error("Error loading Pokemon types:", error)
    }
  }

  async loadPokemon() {
    this.showLoading(true)

    try {
      const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=150")
      const data = await response.json()

      const pokemonPromises = data.results.map(async (pokemon) => {
        const pokemonResponse = await fetch(pokemon.url)
        return await pokemonResponse.json()
      })

      this.pokemonList = await Promise.all(pokemonPromises)
      this.filteredPokemon = [...this.pokemonList]
      this.renderPokemon()
    } catch (error) {
      console.error("Error loading Pokemon:", error)
    } finally {
      this.showLoading(false)
    }
  }

  async handleSearch() {
    const searchInput = document.getElementById("searchInput")
    const searchTerm = searchInput.value.trim().toLowerCase()

    if (!searchTerm) {
      this.filteredPokemon = [...this.pokemonList]
      this.renderPokemon()
      return
    }

    try {
      // Try to search by name or ID
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`)

      if (response.ok) {
        const pokemon = await response.json()

        // Update hero image
        const heroImage = document.getElementById("pokemonDisplay")
        heroImage.src = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default
        heroImage.alt = pokemon.name

        // Filter to show only this Pokemon
        this.filteredPokemon = [pokemon]
        this.renderPokemon()
      } else {
        // Search in existing Pokemon list
        this.filteredPokemon = this.pokemonList.filter(
          (pokemon) => pokemon.name.toLowerCase().includes(searchTerm) || pokemon.id.toString().includes(searchTerm),
        )
        this.renderPokemon()
      }
    } catch (error) {
      console.error("Error searching Pokemon:", error)
      // Fallback to local search
      this.filteredPokemon = this.pokemonList.filter(
        (pokemon) => pokemon.name.toLowerCase().includes(searchTerm) || pokemon.id.toString().includes(searchTerm),
      )
      this.renderPokemon()
    }
  }

  filterByType(type) {
    // Update active filter button
    document.querySelectorAll(".filter-type").forEach((btn) => {
      btn.classList.remove("filter-type--active")
    })

    event.target.classList.add("filter-type--active")

    this.currentFilter = type

    if (!type) {
      this.filteredPokemon = [...this.pokemonList]
    } else {
      this.filteredPokemon = this.pokemonList.filter((pokemon) => pokemon.types.some((t) => t.type.name === type))
    }

    this.renderPokemon()
  }

  toggleFavorites() {
    this.showingFavorites = !this.showingFavorites

    const favoritesToggle = document.getElementById("favoritesToggle")
    favoritesToggle.classList.toggle("pokemon-list__favorites-toggle--active")

    if (this.showingFavorites) {
      this.filteredPokemon = this.pokemonList.filter((pokemon) => this.favorites.includes(pokemon.id))
    } else {
      this.filteredPokemon = [...this.pokemonList]
    }

    this.renderPokemon()
  }

  renderPokemon() {
    const pokemonGrid = document.getElementById("pokemonGrid")
    pokemonGrid.innerHTML = ""

    if (this.filteredPokemon.length === 0) {
      pokemonGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--color-text-muted);">
                    <p>No se encontraron Pokémon</p>
                </div>
            `
      return
    }

    this.filteredPokemon.forEach((pokemon) => {
      const pokemonCard = this.createPokemonCard(pokemon)
      pokemonGrid.appendChild(pokemonCard)
    })
  }

  createPokemonCard(pokemon) {
    const card = document.createElement("div")
    card.className = "pokemon-card"

    const isFavorite = this.favorites.includes(pokemon.id)

    card.innerHTML = `
            <button class="pokemon-card__favorite" data-id="${pokemon.id}">
                <svg class="pokemon-card__favorite-icon ${isFavorite ? "pokemon-card__favorite-icon--active" : ""}" viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            <img class="pokemon-card__image" src="${pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h3 class="pokemon-card__name">${pokemon.name}</h3>
            <p class="pokemon-card__id">#${pokemon.id.toString().padStart(3, "0")}</p>
            <div class="pokemon-card__types">
                ${pokemon.types
                  .map(
                    (type) => `
                    <span class="pokemon-type pokemon-type--${type.type.name}">
                        ${this.translateType(type.type.name)}
                    </span>
                `,
                  )
                  .join("")}
            </div>
        `

    // Add click event for card
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".pokemon-card__favorite")) {
        this.showPokemonDetail(pokemon)
      }
    })

    // Add click event for favorite button
    const favoriteBtn = card.querySelector(".pokemon-card__favorite")
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleFavorite(pokemon.id)
    })

    return card
  }

  toggleFavorite(pokemonId) {
    const index = this.favorites.indexOf(pokemonId)

    if (index > -1) {
      this.favorites.splice(index, 1)
    } else {
      this.favorites.push(pokemonId)
    }

    localStorage.setItem("pokemonFavorites", JSON.stringify(this.favorites))

    // Update the favorite button
    const favoriteBtn = document.querySelector(`[data-id="${pokemonId}"]`)
    const favoriteIcon = favoriteBtn.querySelector(".pokemon-card__favorite-icon")

    if (this.favorites.includes(pokemonId)) {
      favoriteIcon.classList.add("pokemon-card__favorite-icon--active")
      favoriteIcon.setAttribute("fill", "currentColor")
    } else {
      favoriteIcon.classList.remove("pokemon-card__favorite-icon--active")
      favoriteIcon.setAttribute("fill", "none")
    }
  }

  showPokemonDetail(pokemon) {
    const modal = document.getElementById("pokemonModal")
    const modalBody = document.getElementById("modalBody")

    modalBody.innerHTML = `
            <div class="pokemon-detail">
                <img class="pokemon-detail__image" src="${pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}">
                <h2 class="pokemon-detail__name">${pokemon.name}</h2>
                <p class="pokemon-detail__id">#${pokemon.id.toString().padStart(3, "0")}</p>
                <div class="pokemon-detail__types">
                    ${pokemon.types
                      .map(
                        (type) => `
                        <span class="pokemon-type pokemon-type--${type.type.name}">
                            ${this.translateType(type.type.name)}
                        </span>
                    `,
                      )
                      .join("")}
                </div>
                <div class="pokemon-detail__stats">
                    <h3 class="pokemon-detail__stats-title">Estadísticas</h3>
                    ${pokemon.stats
                      .map(
                        (stat) => `
                        <div class="pokemon-stat">
                            <span class="pokemon-stat__name">${this.translateStat(stat.stat.name)}</span>
                            <span class="pokemon-stat__value">${stat.base_stat}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `

    modal.classList.add("modal--visible")
  }

  closeModal() {
    const modal = document.getElementById("pokemonModal")
    modal.classList.remove("modal--visible")
  }

  showLoading(show) {
    const loading = document.getElementById("loading")
    loading.classList.toggle("loading--visible", show)
  }

  translateType(type) {
    const translations = {
      normal: "Normal",
      fire: "Fuego",
      water: "Agua",
      electric: "Eléctrico",
      grass: "Planta",
      ice: "Hielo",
      fighting: "Lucha",
      poison: "Veneno",
      ground: "Tierra",
      flying: "Volador",
      psychic: "Psíquico",
      bug: "Bicho",
      rock: "Roca",
      ghost: "Fantasma",
      dragon: "Dragón",
      dark: "Siniestro",
      steel: "Acero",
      fairy: "Hada",
    }

    return translations[type] || type
  }

  translateStat(stat) {
    const translations = {
      hp: "PS",
      attack: "Ataque",
      defense: "Defensa",
      "special-attack": "At. Especial",
      "special-defense": "Def. Especial",
      speed: "Velocidad",
    }

    return translations[stat] || stat
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PokemonApp()
})
