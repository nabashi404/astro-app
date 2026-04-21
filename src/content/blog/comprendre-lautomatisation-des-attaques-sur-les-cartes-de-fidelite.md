---
title: Comprendre l’automatisation des attaques sur les cartes de fidélité
description: Cet article explore, à travers une expérience personnelle, les mécanismes d’automatisation ainsi que les failles observées dans les systèmes de différentes grandes enseignes de supermarchés
tags: ['CORS', 'XSS', 'ATO']
pubDate: '2026-02-03'
heroImage: '@/assets/images/comprendre-lautomatisation-des-attaques-sur-les-cartes-de-fidelite.png'
---

## Introduction

Le piratage de comptes a connu une expansion fulgurante à partir de 2020. Ce phénomène s’explique notamment par la démocratisation de nouveaux outils open source facilitant l’automatisation de ces attaques.

Ces évolutions ont conduit les attaquants à cibler des services web présentant **un fort potentiel de gain**. Parmi eux, les programmes de fidélité des grandes enseignes comme **Leclerc**, **Auchan** et **Carrefour** occupent une place importante de par un système de cagnotte fidélité.

À travers mon expérience personnelle, je raconte les failles et techniques sophistiquées exploitées pour détourner les systèmes de fidélité des ces géants de la grande distribution.

## L'influence des cyber forums

Tout commence en 2019. C’est à cette période que je découvre, pour la première fois, des forums liés à des activités illegal. En parcourant les différentes sections proposées, une en particulier attire rapidement mon attention : **le cracking**.

Cette section regroupé des utilisateurs qui partagait des *configs* permettant d’interagir automatiquement avec divers services web. Ces configurations sont utilisées pour automatiser des requêtes HTTP, souvent à grande échelle, à l’aide d’outils spécialisés.

> Une *config* est une suite d’instructions spécifique à un site web, que des outils comme OpenBullet peuvent exécuter afin d’automatiser certaines actions (comme des tentatives de connexion à des comptes).

C'est avec le temp que j'ai commencé à comprend et apprend le fonctionnement reseau des application web, ce qui ce passé rellement quand nous essayons de nous connecté avec des indentifians de connexion.

## Découverte d'une faille sur Leclercdrive

En 2021, je décide de m’exercer sur le site **leclercdrive.fr**. Mon objectif était de réussir *l'automatisation de tentatives de connexion* afin d'accéder à des comptes valides et donc d'obtenir leurs solde de fidélité.

Acune personne n'avais en sa possession une tel configuration et pour cause le site disposait de mécanismes de protection avancés, notamment **DataDome**, une solution spécialisée dans la protection anti-bot, ainsi qu’un système de captcha tel que **hCaptcha**. Ces protections étaient censées empêcher toute automatisation abusive.

Tout cela était bien configuré sur des serveurs prédéfinis par Leclerc, utilisant des sous-domaines aux schémas allant de `fd1-secure` à `fd15-secure`. En voici un example, pour ce connecté:

```
https://fd8-secure.leclercdrive.fr/drive/connecter.ashx
```

Cependant, en regardant toute cette sécurité mise en place sur ces sous-domaines, je me suis demandé ce qui se passerait si je modifiais celui par un autre bien moins surveillé, le `www`, et c'est à ce moment-là que j'ai découvert que ma tentative de connexion a été exécutée avec succès sans appliquer aucune protection à celle-ci.


## Impact et exploitation

Cette modification d'url a permis l'automatisation de requêtes HTTP simulant des tentatives de connexion en évitant toutes les mesures anti-bot du site.

> ⚠️ **Disclaimer**
> Les actions décrites dans cet article sont illégales. Elles ont été réalisées dans le passé, à une époque où je n’avais pas encore pleinement conscience des enjeux éthiques.
> Ce retour d’expérience est partagé uniquement à des fins éducatives et de sensibilisation.

Suite à l’accès à un compte, il n’était toutefois pas possible d’exploiter directement la cagnotte associée, car toutes actions sensibles liées à une carte demandent un code secret à quatre chiffres que connaissent uniquement le créateur de la carte.

Toutefois, avec un peu d'imagination, le code secret pouvait être détourné à l'aide de codes simples comme **1234** ou **0000**, des numéros détenus dans le mot de passe ou des informations personnelles comme la date de naissance.

## Attaque par brut force

Lors d'une phase de reconnaissance pour élargir la portée d'attaque, j'ai identifié deux sites **E.Leclerc** avec la même vulnérabilité, une faiblesse présente sur les pages d'inscription, maisonetloisirs.leclerc et auto.leclerc avais le meme template de page de creation de compte avec un formulaire pour ajouter sa carte. 

![maisonetloisirs.leclerc-register-page](@/assets/images/maisonetloisirs.leclerc-register-page.png)

Mais là où les sites principaux E.Leclerc et Leclerdrive.fr ont une limite, avec en conséquence le blocage de la carte suite à cinq tentatives échouées, ceux-là n'en possédaient pas, ce qui a permis de brute force le code confidentiel par incrémentation.

En conclusion, cette attaque permettait de récupérer le code secret de n’importe quelle carte avec un taux de succès de 100%. Suite à cela, Leclerc a fini par corriger toutes les failles et a renforcé les vérifications d'identité lorsque qu'un client a demandé à vider sa cagnotte fidélité.

## Auchan et navigateur contrôlé

C’est en 2022 que je découvre et commence à utiliser **Selenium**, après qu’une connaissance met demandé de créer une configuration pour le site Auchan.

> **Selenium** permet d’automatiser des actions dans un navigateur sans interaction humaine.

Cette nouvelle techno ajoutée aux configs permettait de contourner le besoin de JavaScript notamment dans la génération de cookies.

Voici ce que ma configuration faisait:

Commence par récupérer un token **CSRF**, nécessaire pour sécuriser l’envoi du formulaire.

Ensuite, une requête d'inscription est envoyée avec le token et une adresse email.

Si le site renvoi que l'utilisateur est deja inscrit, un navigateur automatisé est lancé pour effectuer une tentative de connexion réelle au compte Auchan.

Après cela, une analyse du contenu de la page est faite pour :

* vérifier si l'utilisateur est connecté au compte
* déterminer si le compte possède une carte de fidélité
* identifier si le compte possede une carte fidelité et extrait son montant
* extrait la date de naissance via la page profile et genere les potentiels code valide avec 
* enfin vérifie les codes

Il n'y avait rien eu de très faible chez Auchan, mise à part l'automatisation possible

## Prendre le probleme à l'envers sur Carrefour

Enfin, après l'expérience acquise, il m'est venu une idée au sujet de Carrefour.fr. En effet, j'avais appris que certaines cartes avaient des codes très simplifiés qui ont été autorisés dans le passé et que des utilisateurs avaient toujours, Si je connaissais d'avance le code secret, alors il me restait qu'à deviner des cartes valides et dans ce sens-là tout devient plus simple.

Je me suis alors rendu sur le site web https://www.carrefour.fr et comme un utilisateur lambda j'ai lié une carte à mon compte. La requete ressemblé à queqlque chose comme :

![maisonetloisirs.leclerc-register-page](@/assets/images/attach-loyalty-card-carrefour-request.svg)

En generant autant de numeros de carte que voulu je pouvais ensuite les passés par la fonctionnalité d'ajout avec les codes simple **1234** ou **0000**.

L'impact était tel que, en quelques minutes seulement, des cartes valides s'affichent sur mon terminal avec leurs soldes les unes à la suite des autres.

Suite à cet abus, Carrefour a rapidement mis en place des captchas et une limite d'ajout de 5 cartes journalières qui convient à stopper cette attaque, mais pas de façon définitive.

## Carrefour post correctif

À suivre ...
