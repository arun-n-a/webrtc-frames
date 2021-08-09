cmd_Release/ndi.node := ln -f "Release/obj.target/ndi.node" "Release/ndi.node" 2>/dev/null || (rm -rf "Release/ndi.node" && cp -af "Release/obj.target/ndi.node" "Release/ndi.node")
