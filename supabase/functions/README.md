# Déploiement des fonctions Edge

La création d'un compte étudiant utilise la fonction `admin-create-student`.
Elle doit être déployée dans le projet Supabase avant utilisation :

```bash
npx supabase login
npx supabase link --project-ref woeqowsijbtljifvgcfu
npx supabase functions deploy admin-create-student
```

Le fichier source est `admin-create-student/index.ts`. Après le déploiement,
la fonction sera disponible à l'adresse :

`https://woeqowsijbtljifvgcfu.supabase.co/functions/v1/admin-create-student`

Dans Supabase Dashboard, vérifiez également que le compte connecté possède
`profiles.is_admin = true` : la fonction refuse volontairement toute création
par un utilisateur non administrateur.
