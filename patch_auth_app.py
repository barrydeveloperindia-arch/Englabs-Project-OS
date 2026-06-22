import re

filepath = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Imports
if "import { Login }" not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { Login } from '@shared/components/auth/Login';\nimport { AuthService } from '@shared/services/auth_service';\nimport { User } from '@shared/types/database.types';"
    )

# 2. Replace Auth State and Logout
auth_state_old_pattern = r"const \[isAuthenticated, setIsAuthenticated\].*?const handleLogout = \(\) => {.*?};"
auth_state_new = """const [authInitializing, setAuthInitializing] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        AuthService.init((user) => {
            setCurrentUser(user);
            setAuthInitializing(false);
        });
    }, []);

    const handleLogout = async () => {
        await AuthService.logout();
    };"""

content = re.sub(auth_state_old_pattern, auth_state_new, content, flags=re.DOTALL)

# 3. Replace Render Block for Auth
render_auth_old_pattern = r"if \(!isAuthenticated\) \{.*?return \(\n\s*<div className=\"h-screen w-screen.*?</div>\n\s*\);\n\s*\}"
render_auth_new = """if (authInitializing) {
        return <div className="h-screen w-screen bg-[#092a42] flex items-center justify-center text-white font-black text-2xl animate-pulse">AUTHORIZING SECURITY...</div>;
    }

    if (!currentUser) {
        return <Login />;
    }"""

content = re.sub(render_auth_old_pattern, render_auth_new, content, flags=re.DOTALL)

# 4. Replace userRole references in DesktopSidebar with currentUser?.role
content = content.replace("userRole={userRole}", "userRole={currentUser?.role || 'Engineer'}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Firebase Auth successfully integrated into App.tsx")
