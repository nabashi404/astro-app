---
title: "Prise de contrôle d'un compte de cashback en un seul clic depuis n'importe quel site web"
description: "Comment une série de mauvaises pratiques web m’a permis de prendre le contrôle de comptes en un seul clic sur un site web"
tags: ['CORS', 'XSS', 'ATO']
pubDate: '2026-02-03'
heroImage: '@/assets/images/prise-de-controle-dun-compte-en-un-seul-clic-sur-nimporte-quelle-site-web.png'
---

## Introduction

Imaginez être connecté à votre service de cashback préféré lorsque, soudainement, vous cliquez sur un site qui n’a absolument rien à voir avec celui-ci. Sans que vous ne vous en rendiez compte, cette simple action permet à la personne contrôlant ce site d’obtenir un accès total et persistant à votre compte.

Ce scénario, aussi improbable qu’il puisse paraître, a pourtant été possible. À travers cet article, je vais vous expliquer comment.

## Mes débuts avec l’application

Depuis plusieurs jours, je me suis intéressé à une application française spécialisée dans le cashback. Au cours de mes premières analyses, j’ai découvert plusieurs vulnérabilités critiques, dont une **IDOR**, une **Open Redirect** combinée à une **XSS reflected**, ainsi qu’une **XSS stoked**.  
Ces failles permettaient notamment de voler les IBAN des utilisateurs ou de prendre le contrôle de leurs comptes.

Ces découvertes m’ont poussé à approfondir mes connaissances sur le fonctionnement interne de la plateforme.

Une question s’est alors imposée :  
_Comment l’application identifie-t-elle ses utilisateurs et valide-t-elle l’attribution du cashback ?_

## Une communication inter-sites excessivement permissive

Par défaut, les sites web ne sont pas autorisés à communiquer entre eux pour des raisons de sécurité. Cette protection est mise en place par les navigateurs et s’appelle **CORS** (*Cross-Origin Resource Sharing*).

Or, j’ai rapidement constaté que la configuration CORS utilisée par l’application était **particulièrement permissive**, autorisant des requêtes JavaScript provenant de domaines tiers et facilitant ainsi des échanges inter-sites risqués.

<figure class="text-center">
  <img
    src="/images/attack-on-cors.svg"
    alt="attack on cors"
    class="mx-auto"
  />
  <figcaption>
    Qu'est-ce que le CORS (Cross-Origin Resource Sharing) – <a href="https://portswigger.net/web-security/cors">portswigger.net</a>
  </figcaption>
</figure>

## Les fonctionnalités vulnérables

En analysant le parcours utilisateur classique pour accéder à du cashback via une boutique partenaire, deux points de terminaison ont rapidement attiré mon attention :

1. **https://disclosed.com/crossite/put_val/**  
   Cette URL prenait deux paramètres :
   - **member_id** : correspondant au cookie de session de l’utilisateur
   - **uid** : une valeur pseudo-aléatoire  

   À partir de ces valeurs, l’application créait un cookie nommé `crossite[member_id]` (avec *member_id* injecté dans le nom du cookie) et lui assignait comme valeur le contenu de **uid**.

   > Exemple :  
   > *https://disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=6981065608542*  
   > crée le cookie **crossite6add22nupndc1leekfk7q33uip=6981065608542**

2. **https://disclosed.com/crossite/get_val/**  
   Ce second endpoint renvoyait ensuite la valeur du cookie précédemment stocké, en se basant sur le paramètre **member_id**.

   > Exemple :  
   > *https://disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm*  
   > retourne **6981065608542**

Le paramètre **uid** était particulièrement intéressant, car son contenu était directement reflété dans la réponse.  
J’ai donc injecté une balise `<script>alert(document.cookie)</script>` dans ce paramètre, puis appelé le second point de terminaison.

![account-takeover-in-one-click-xss-screenshoot](@/assets/images/account-takeover-in-one-click-xss-screenshoot.webp)

Cela a confirmé la présence d’une **XSS stockée**, la charge s’exécutant avec succès depuis la valeur du cookie.

## Scénario d’attaque

Un attaquant aurait pu cibler un compte disposant de permissions élevées, comme un compte de support, via un formulaire de contact dédié à chaque utilisateur.  
Il aurait par exemple prétexté qu’une redirection ne fonctionne plus, en indiquant un lien du type :  
`https://www.disclosed.com/redirection/marchand/amazon/`

Cette étape, bien que facultative, permettait de s’assurer que la victime était connectée et que son cookie de session soit exploitable.  
La victime pouvait ensuite être redirigée vers n’importe quel site contrôlé par l’attaquant, contenant la charge utile.

J’ai ainsi construit un script, à titre de preuve de concept, qui s’exécute automatiquement au chargement de la page, exfiltre les cookies vers un domaine contrôlé par l’attaquant, puis redirige la victime vers un site légitime afin de ne rien éveiller de suspect.

## Persistance du contrôle d’accès

J’étais sur le point de publier cet article lorsque je me suis rendu compte d’une faille logique totalement aberrante, aggravant encore l’impact de la prise de contrôle du compte.

Je pensais initialement que la session utilisateur reposait uniquement sur un cookie de session **PHPSESSID**.  
Pour rappel, un cookie de session n’existe que durant une session de navigation et est supprimé à la fermeture du navigateur.

Or, j’ai découvert qu’un autre cookie permettait de restaurer la session automatiquement, même si l’utilisateur se déconnecte, change son adresse email ou modifie son mot de passe.

## Conclusion

Cette attaque a été rendue possible par une mauvaise gestion du **CORS** et des cookies.  
Bien qu’elle nécessite une authentification préalable et que l’utilisateur clique sur au moins un lien de redirection vers une boutique affiliée, elle reste extrêmement dangereuse.

N’importe quel site web peut servir de vecteur d’attaque en hébergeant et exécutant une charge JavaScript de manière discrète, avant de rediriger la victime en une fraction de seconde.  
De plus, la persistance du contrôle permet de conserver l’accès au compte indépendamment des actions entreprises par l’utilisateur.

Dans ce contexte, il est quasiment impossible pour un utilisateur de s’en prémunir seul.
