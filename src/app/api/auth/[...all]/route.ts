import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "../../../../shared/composition/auth";

export const { GET, POST } = toNextJsHandler(auth);
