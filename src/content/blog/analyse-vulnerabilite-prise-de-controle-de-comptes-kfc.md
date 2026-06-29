---
title: 'Analyse d’une vulnérabilité permettant la prise de contrôle de comptes sur KFC'
description: 'Étude d’une faille de sécurité liée à de mauvaises pratiques d’implémentation permettant l’accès à des comptes utilisateurs et analyse de son impact.'
tags: ['ATO', '2FA']
pubDate: '2026-06-29'
heroImage: '@/assets/images/kfc.png'
---

## Introduction

Au cours de mes recherches personnelles sur l'application web **kfc.fr**, j'ai identifié une faille de sécurité particulièrement critique qui permet, à ce jour, de prendre le contrôle de n'importe quel compte utilisateur en connaissant simplement l'adresse e-mail de la victime.

Après plusieurs mois d'attente sans aucune réponse et malgré plusieurs tentatives de signalement qui n'ont pas été prises au sérieux, j'ai décidé de publier cet article afin d'expliquer en détail cette vulnérabilité, son impact potentiel ainsi que les différentes méthodes de contournement qui ont été utilisées pour l'exploiter.

L'objectif de cette publication est de sensibiliser aux enjeux de la sécurité des applications web et de documenter les failles rencontrées au cours de mes recherches.

## Origines de ma recherche de vulnérabilités sur KFC

Pour comprendre toute mon histoire, il faut remonter à mi-2023.

À cette période, j’avais commencé mes premières recherches de failles sur le site officiel de KFC. Pour être transparent, mon objectif initial était d’évaluer la possibilité d’automatiser certaines requêtes via des scripts, dans le but d’identifier des comptes valides.

Cependant, un élément bloquait cette approche : un mécanisme de sécurité mis en place pour limiter ce type d’abus. Il s’agissait d’un **WAF (Web Application Firewall)**, une solution utilisée pour filtrer et surveiller les requêtes entrantes afin de protéger le site contre différentes formes d’attaques. Sur KFC.fr, cette protection était notamment fournie par Akamai.

Un WAF agit comme un pare-feu applicatif, analysant le trafic HTTP afin de bloquer les comportements suspects et les tentatives d’exploitation.

Mais ce n'est que en quelque minutes que je suis arrivé à contourner tout cela, comment ? En me souvenant d'un vieux article de blog lue des années auparavant.

le principe était de rechercher et de découvrire l'addres exacte du site web pour lui envoyé directement nos requetes et aisni contourner tout parfeu.

## Exploration approfondie du mécanisme de double authentification

Revenons en 2026. Cette fois-ci, je me suis intéressé en profondeur à la fonctionnalité de double authentification.

L’objectif de ce mécanisme est simple : lors d’une tentative de connexion sensible, un code unique et aléatoire est envoyé par email à l’utilisateur, qui doit ensuite le saisir sur le site afin de valider l’accès à son compte.

En théorie, cette approche constitue une protection efficace contre la prise de contrôle de comptes.

Cependant, dans la pratique, une mauvaise intégration ou certaines incohérences dans la logique applicative peuvent parfois réduire fortement son efficacité, comme nous allons le voir.

## Reverse engineering

Depuis ma premiere exploitation KFC à ajouter le chiffrement de ces données coté frontend, protection cassé en une soirée en lisant le code Javescript et à l'aide d'agent IA, cela aide ennormennt à automatisé les requetes.

Second securité est un ban IP si les requetes trop frequente sont detecter, elle aussi détourné en ajoutant le header 'X-Forwarded-For: 0.0.0.0'.

Le derniere piece du puzzle est quil ma fallu decouvrir par quelque test est que un code est valide 10 mins et qu'un nouveau code et envoyer tout les 2 minutes ne invalidant pas l'ancien. Tout cela mis bout à bout donne [KFC2FABypass](https://github.com/nabashi404/KFC2FABypass) une application console Proof of concept.

## Signalement auprès du service KFC

J’ai contacté KFC le **25 mars 2026** afin de signaler la vulnérabilité identifiée.

Le lendemain, j’ai reçu une réponse me redirigeant vers une adresse email dédiée pour les signalements de sécurité. J’ai alors réitéré mon message via ce nouveau canal.

Depuis cet échange, je n’ai pas obtenu de retour malgré plusieurs relances effectuées sur une période prolongée.

Dans ce contexte, et après un certain délai sans prise en charge apparente du signalement, j’ai pris la décision de publier cette analyse afin de documenter la faille et ses implications.
