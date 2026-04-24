import AccountForm from "@/components/AccountForm";

export default function ComptePage() {
  return (
    <div className="container">
      <div className="page-head">
        <div className="eyebrow">Votre espace</div>
        <h1 className="page-title">Mon <em>compte</em></h1>
        <p className="page-sub">Gérez vos informations personnelles et votre mot de passe.</p>
      </div>

      <AccountForm
        apiUrl="/api/couple/compte"
        title="Informations du compte"
        fields={[
          { key: "prenoms",  label: "Vos prénoms",    placeholder: "Sophie & Marc" },
          { key: "email",    label: "Adresse email",  type: "email", placeholder: "sophie@email.com" },
        ]}
      />
    </div>
  );
}
