import safehomeLogo from "../../assets/safehomeLogo.png";
import safehomeLogoWhite from "../../assets/safehomeLogoWhite.png";

const BRAND_LOGO_BY_VARIANT = {
  default: safehomeLogo,
  white: safehomeLogoWhite,
};

function BrandLogo({ className = "", alt = "SafeHome", variant = "default" }) {
  return <img src={BRAND_LOGO_BY_VARIANT[variant] || safehomeLogo} alt={alt} className={className} />;
}

export default BrandLogo;
