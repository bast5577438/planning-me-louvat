# 🍪 Planning Biscuiterie Louvat

Une application web moderne, fluide et responsive dédiée à la planification et à la coordination des prestations commerciales pour les vendeuses et démonstratrices partenaires indépendantes de la **Biscuiterie Louvat**.

---

## 📋 Présentation du Projet

Cette plateforme permet de simplifier l'organisation interne de la Biscuiterie Louvat en mettant en relation la **Gérante** de l'entreprise et ses **Partenaires Indépendantes** (micro-entrepreneurs) dans un cadre de collaboration fluide, moderne et respectueux de l'autonomie de chacun.

### ⚖️ Cadre de Collaboration Indépendante (B2B)
L'application intègre nativement les mentions de transparence nécessaires au respect du cadre légal de la micro-entreprise :
* **Prestation volontaire et autonome** : Aucun lien de subordination hiérarchique.
* **Liberté de positionnement** : Les partenaires choisissent et planifient leurs jours de prestation en fonction de leurs disponibilités.
* **Transparence financière** : Calcul en temps réel de la valeur de la prestation de service sur la base d'un tarif horaire défini.

---

## ✨ Fonctionnalités Majeures

### 1. 📅 Calendrier Interactif (Vue Vendeuse)
* **Positionnement en un clic** : Inscription libre pour une journée complète sur une boutique active.
* **Calculateur de Prestation** : Affichage automatique de la durée de la prestation (ex: 8 heures) et du gain associé.
* **Délai de Prévenance Respectueux** : Un message d'information rappelle l'importance du délai de prévenance pour assurer l'approvisionnement logistique en biscuits frais.
* **Sécurité Anti-Doublons** : Empêche l'inscription multiple sur le même créneau et la même boutique lorsque la capacité maximale est atteinte.

### 2. 💼 Tableau de Bord Administration (Vue Gérante)
* **Suivi Global** : Vue d'ensemble sur le planning mensuel de toutes les boutiques.
* **Gestion des Boutiques Actives** : Configuration et activation des boutiques avec leurs périodes d'ouverture.
* **Statistiques & Synthèse** : Suivi des heures cumulées et de l'encours de facturation par partenaire.
* **Alerte Vacance à J-7** : Système intelligent identifiant les boutiques actives sans aucun partenaire planifié à une semaine de l'échéance. Permet à la gérante de s'envoyer un rappel par e-mail en un clic pour coordonner un créneau.

### 3. 👥 Gestion des Partenaires & Paramètres
* **Annuaire Partenaires** : Ajout et suivi du statut d'activité des vendeuses partenaires.
* **Paramétrage Flexible** : Modification des taux horaires par défaut, heures de service par jour, capacité maximale par boutique, et adresses e-mail de notification.

### 4. 🗄️ Persistance & Synchronisation Temps Réel
* **Base de Données Firestore** : Sauvegarde robuste et centralisée des données (réservations, utilisateurs, boutiques, logs et paramètres).
* **Mode Hors-Ligne** : L'application utilise une logique robuste de stockage local (`localStorage`) en secours pour garantir une expérience utilisateur ininterrompue.
* **Exportation** : Exportation des données de planning au format JSON pour une sauvegarde externe simplifiée.

---

## 🛠️ Stack Technique

* **Framework** : React 18+ (avec TypeScript)
* **Outil de Build** : Vite
* **Design & Styles** : Tailwind CSS (Theme personnalisé élégant aux tons de biscuit et café : Amber/Stone)
* **Icônes** : Lucide React
* **Base de données** : Firebase / Firestore (avec règles de sécurité déployées)

---

## 🚀 Installation et Démarrage

### Prérequis
* Node.js (version 18 ou supérieure recommandée)
* npm (ou yarn)

### Lancement en local
1. Installez les dépendances du projet :
   ```bash
   npm install
   ```

2. Créez un fichier `.env` basé sur `.env.example` pour configurer vos clés API et variables Firebase.

3. Démarrez le serveur de développement local :
   ```bash
   npm run dev
   ```
   L'application sera accessible par défaut sur `http://localhost:3000`.

4. Pour compiler l'application pour la production :
   ```bash
   npm run build
   ```

---

## 📂 Structure du Projet

```text
├── assets/                  # Ressources visuelles (logos, images)
├── firebase-blueprint.json  # Structure et schéma de données Firestore
├── firestore.rules          # Règles de sécurité de la base de données Firestore
├── src/
│   ├── App.tsx              # Point d'entrée principal de l'application
│   ├── main.tsx             # Point de montage React
│   ├── types.ts             # Déclarations des interfaces TypeScript communes
│   ├── components/          # Composants modulaires (Dashboard, Calendar, Navbar, etc.)
│   └── utils/               # Utilitaires de synchronisation et stockage Firestore
└── package.json             # Manifeste des dépendances et scripts
```

---

*© 2026 Biscuiterie Louvat — Outil interne destiné à l'organisation des prestations commerciales.*
