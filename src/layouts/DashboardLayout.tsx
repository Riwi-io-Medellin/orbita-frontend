import { Outlet } from "react-router";

function DashboardLayout() {
    return (
        <div>
            <header>
                <h1>Orbita</h1>
            </header>

            <aside>
                <nav>
                    <a href="/">Dashboard</a>
                </nav>
            </aside>

            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;