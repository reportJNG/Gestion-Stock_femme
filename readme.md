<div align="center">
  <img src="public/images.png" alt="Gestion Stock logo" width="96" height="96" />

  <h1>Gestion Stock</h1>

  <p>
    Application professionnelle de gestion de stock, ventes, codes-barres,
    travailleurs et rapports pour une boutique de vetements.
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" />
    <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=111" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss&logoColor=white" />
  </p>
</div>

---

## Apercu

**Gestion Stock** est une application web complete pour piloter les operations quotidiennes d'une boutique: catalogue produits, variantes couleur/taille, stock, ventes par scanner, historique, rapports, exports, alertes et gestion des travailleurs.

L'application est construite avec **Next.js App Router**, **Supabase Auth/Postgres/Storage**, **TanStack Query**, **Tailwind CSS**, **Radix UI**, **Recharts**, **jsPDF**, **Excel export**, et une logique metier SQL robuste cote base de donnees.

## Fonctionnalites

| Module | Description |
| --- | --- |
| Tableau de bord | Chiffre d'affaires du jour, articles vendus, valeur du stock, alertes stock faible et meilleurs produits. |
| Produits | Recherche, filtre par categorie, pagination, creation, modification, detail produit et archivage. |
| Variantes | Gestion des couleurs, tailles, quantites, codes-barres et etiquettes imprimables. |
| Stock | Entrees et sorties rapides de stock avec journalisation des mouvements. |
| Scanner | Scan camera ou saisie manuelle de code-barres pour enregistrer une vente instantanement. |
| Ventes | Historique filtre par periode, details de vente, recus et snapshots des articles vendus. |
| Rapports | Revenus, benefices, transactions, valeur stock, graphiques et exports PDF/Excel. |
| Travailleurs | Creation, suppression, activation, role worker/admin et suivi des performances. |
| Parametres | Nom boutique, seuil stock faible, TVA, theme clair/sombre et deconnexion. |
| Archives | Soft delete des produits/variantes avec conservation de l'historique de vente. |

## Stack Technique

| Couche | Technologies |
| --- | --- |
| Framework | Next.js 14 App Router |
| Langage | TypeScript |
| UI | React 18, Tailwind CSS, Radix UI, lucide-react, shadcn-style components |
| Data fetching | TanStack React Query |
| Backend | Supabase Auth, Postgres, Storage, RLS, RPC SQL |
| Scanner | html5-qrcode |
| Codes-barres | JsBarcode, Code128 |
| Graphiques | Recharts |
| Exports | jsPDF, jspdf-autotable, xlsx-js-style |
| Formulaires | react-hook-form, zod |
| Notifications | sonner |
| Theme | next-themes |

## Architecture

```txt
src/
  app/
    (auth)/connexion/          # Page de connexion
    (app)/                     # Interface protegee
      tableau-de-bord/         # Dashboard
      produits/                # Catalogue, detail, creation, edition
      stock/                   # Ajustements rapides de stock
      scanner/                 # Vente par code-barres
      ventes/                  # Historique et detail des ventes
      rapports/                # Statistiques et exports
      travailleurs/            # Gestion des travailleurs
      archives/                # Produits archives
      parametres/              # Configuration boutique
    api/workers/               # API admin pour creer/supprimer les travailleurs
    providers.tsx              # Providers React Query, Theme, Auth, Toaster

  components/
    dashboard/                 # Cartes statistiques et graphiques
    products/                  # Fiches produits, variantes, labels
    scanner/                   # Scanner camera et saisie manuelle
    stock/                     # Stock in/out rapide
    workers/                   # Tableau, formulaires, panels
    layout/                    # Header, sidebar, mobile nav
    ui/                        # Composants UI reutilisables

  hooks/                       # Hooks metier Supabase/Query
  contexts/AuthContext.tsx     # Session, roles, droits, cache auth
  lib/
    barcode/                   # Generation et algorithme codes-barres
    export/                    # PDF/Excel rapports
    print/                     # Recus et etiquettes
    supabase/                  # Client Supabase navigateur
    utils.ts                   # Formatage, helpers UI

Sql/
  supabase_schema.sql          # Schema complet Supabase + fonctions + RLS
```

## Modele Metier

### Produits et variantes

Un produit represente un modele de base, par exemple `Nike Air Force`. Les variantes representent les combinaisons vendables:

```txt
Produit
  -> Couleur
  -> Taille
  -> Code-barres unique
  -> Quantite disponible
```

Le code-barres est genere avec ce format:

```txt
[CAT(2)][SEQ(4)][CLR(2)][SIZE(3)]
```

Exemples:

| Code | Signification |
| --- | --- |
| `TS0001BKXLG` | T-shirt numero 1, noir, XL |
| `SH0002WH042` | Chaussure numero 2, blanc, pointure 42 |
| `PT0003BU032` | Pantalon numero 3, bleu, taille 32 |

### Categories incluses

| Code | Categorie | Type de taille |
| --- | --- | --- |
| `TS` | T-shirts / Hauts | Vetements |
| `SH` | Chaussures | Pointures |
| `PT` | Pantalons / Jeans | Tour de taille |
| `JK` | Vestes / Manteaux | Vetements |
| `AC` | Accessoires | Taille libre |
| `OT` | Autres Vetements | Taille libre |

## Roles et Acces

| Role | Acces |
| --- | --- |
| Admin | Acces complet: dashboard, produits, stock, ventes, rapports, travailleurs, parametres. |
| Worker | Acces limite: scanner, stock, ventes et pages autorisees par le middleware. |

La protection des routes est geree par `src/middleware.ts`. Les donnees sensibles sont aussi protegees par les politiques **RLS Supabase** definies dans `Sql/supabase_schema.sql`.

## Base de Donnees Supabase

Le schema SQL inclut:

- Tables: `profiles`, `products`, `product_variants`, `brands`, `categories`, `colors`, `size_presets`, `sales`, `sale_items`, `stock_movements`, `notifications`, `settings`, `sync_queue`.
- Fonctions RPC: generation SKU, creation produit avec variantes, vente par code-barres, ajout de stock, archivage, purge des archives.
- Vues analytiques: `v_variant_full`, `v_daily_stats`, `v_top_products`, `v_low_stock`, `v_stock_value`.
- RLS: lecture authentifiee, ecriture admin, creation de ventes par utilisateurs authentifies, notifications par utilisateur.
- Storage: bucket public `product-images` pour les images produit.

<details>
<summary><strong>Fonctions SQL importantes</strong></summary>

| Fonction | Utilisation |
| --- | --- |
| `generate_sku` | Cree un code-barres stable depuis categorie, sequence, couleur et taille. |
| `normalize_size_code` | Convertit une taille en code court de 3 caracteres. |
| `create_product_with_all_variants` | Cree un produit et toutes ses variantes couleur/taille. |
| `sell_by_barcode` | Enregistre une vente, cree les lignes de vente et diminue le stock. |
| `add_stock_to_variant` | Ajoute du stock et journalise le mouvement. |
| `archive_variant` | Archive une variante sans casser l'historique. |
| `archive_product` | Archive un produit et toutes ses variantes. |
| `purge_expired_archives` | Supprime les archives expirees selon la retention configuree. |

</details>

## Installation

### Prerequis

- Node.js 18.17 ou plus recent
- npm
- Un projet Supabase
- Supabase CLI, optionnel mais utile pour generer les types

### 1. Installer les dependances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Creer un fichier `.env.local` a la racine:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` cote client. Elle est uniquement utilisee dans les routes serveur `/api/workers/*`.

### 3. Importer le schema Supabase

Executer le contenu de:

```txt
Sql/supabase_schema.sql
```

dans l'editeur SQL Supabase.

### 4. Demarrer le serveur de developpement

```bash
npm run dev
```

Ouvrir ensuite:

```txt
http://localhost:3000
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance l'application en developpement. |
| `npm run build` | Compile l'application pour production. |
| `npm run start` | Lance la version production compilee. |
| `npm run lint` | Execute ESLint. |
| `npm run type-check` | Verifie TypeScript sans generer de build. |
| `npm run db:types` | Genere les types Supabase locaux dans `src/types/supabase.ts`. |
| `npm run analyze` | Lance un build avec analyse bundle. |

## Workflow Utilisateur

### Admin

1. Se connecter a `/connexion`.
2. Consulter le tableau de bord.
3. Creer les produits avec categorie, marque, couleurs, tailles, image, prix HT, TVA et quantites.
4. Imprimer les etiquettes codes-barres.
5. Suivre les ventes, stocks faibles et rapports.
6. Gerer les travailleurs et leurs acces.

### Worker

1. Se connecter avec un compte worker.
2. Arriver automatiquement sur `/scanner`.
3. Scanner un code-barres ou saisir le code manuellement.
4. Enregistrer une vente.
5. Consulter les ventes autorisees et ajuster le stock si necessaire.

## Exports et Impression

L'application prend en charge:

- Export PDF des rapports.
- Export Excel des rapports.
- Impression de recus de vente.
- Impression d'etiquettes produit/code-barres.
- Generation Code128 pour les variantes.

## Securite

- Authentification Supabase par email/mot de passe.
- Middleware Next.js pour redirections et controle d'acces.
- RLS Supabase pour proteger les tables.
- Service role reservee aux routes serveur de gestion travailleurs.
- Separation des roles `admin` et `worker`.
- Snapshots de vente dans `sale_items` pour conserver l'historique meme si un produit est archive puis purge.

## Qualite et Robustesse

- React Query configure pour refetch sur reconnexion et focus.
- Etats de chargement, vide et erreur sur les pages principales.
- Gestion des timeouts Supabase via utilitaires dedies.
- Archivage doux pour preserver les ventes.
- Journal complet des mouvements de stock.
- Algorithme de code-barres deterministic et lisible.

## Routes Principales

| Route | Page |
| --- | --- |
| `/connexion` | Connexion |
| `/tableau-de-bord` | Dashboard |
| `/produits` | Liste produits |
| `/produits/nouveau` | Creation produit |
| `/produits/[id]` | Detail produit |
| `/produits/[id]/modifier` | Modification produit |
| `/stock` | Gestion rapide du stock |
| `/scanner` | Scanner code-barres |
| `/ventes` | Historique des ventes |
| `/ventes/[id]` | Detail d'une vente |
| `/rapports` | Rapports et exports |
| `/travailleurs` | Gestion travailleurs |
| `/travailleurs/[id]` | Detail travailleur |
| `/archives` | Archives |
| `/parametres` | Parametres |

## Captures d'ecran

Ajoutez vos captures dans `public/` puis remplacez les chemins ci-dessous.

```md
![Dashboard](public/screenshots/dashboard.png)
![Produits](public/screenshots/products.png)
![Scanner](public/screenshots/scanner.png)
```

## Deploiement

L'application peut etre deployee sur Vercel ou tout hebergeur compatible Next.js.

Checklist avant production:

- Configurer les variables d'environnement.
- Importer `Sql/supabase_schema.sql`.
- Creer le premier utilisateur admin dans Supabase Auth.
- Verifier que le profil correspondant existe dans `profiles` avec `role = 'admin'` et `is_active = true`.
- Tester la creation produit, l'impression d'etiquettes, une vente par scan et les exports.

## Licence

Projet prive. Definir une licence avant publication publique.

---

<div align="center">
  <strong>Gestion Stock</strong><br />
  Next.js + Supabase pour une gestion de boutique rapide, claire et fiable.
</div>
