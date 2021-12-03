import Link from "next/link";
function NavBar() {
  return (
    <div className="flex flex-col items-center justify-center w-full ">
      <div className="flex p-4 space-x-10 text-lg text-yellow-500 border-b border-yellow-500">
        <div>
          <Link href="/">
            <a>🏡 Home</a>
          </Link>
        </div>
        <div>
          <Link href="/builder">
            <a>🔩 Builder</a>
          </Link>
        </div>
        <div>
          <Link href="/hanger">
            <a>🏬 Hanger</a>
          </Link>
        </div>
        <div>
          <Link href="/launch">
            <a>🚀 Launchpad</a>
          </Link>
        </div>
        <div>
          <Link href="/marketplace">
            <a>💷 Marketplace</a>
          </Link>
        </div>
        <div>
          <Link href="/settings">
            <a>⚙️ Settings</a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
