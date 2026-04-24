import AccountForm from "@/components/AccountForm";

export default function ProComptePage() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Votre espace</div>
        <h1 className="page-title">Mon <em>compte</em></h1>
        <p className="page-sub">Gérez vos informations personnelles et votre mot de passe.</p>
      </div>

      <AccountForm
        apiUrl="/api/pro/compte"
        title="Informations du compte"
        fields={[
          { key: "name",  label: "Nom de l'atelier",  placeholder: "Studio Mila & Jules" },
          { key: "email", label: "Adresse email",     type: "email", placeholder: "vous@atelier.fr" },
          { key: "phone", label: "Téléphone",         placeholder: "+33 6 …" },
        ]}
      />
    </>
  );
}
