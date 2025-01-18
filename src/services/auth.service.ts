import pocketbase from "@/lib/pocketbase";
// import supabase from "@/lib/supabase";

class AuthService {
  async signIn({ username, password }) {
    try {
      const authData = await pocketbase
        .collection("users")
        .authWithPassword(username, password);

      return {
        names: authData?.record?.name,
        role: authData?.record?.role,
        department: authData?.record?.department,
        email: authData?.record?.email,
        id: authData?.record?.id,
        photo: authData?.record?.avatar,
      };
    } catch (error) {
      console.log(error);
      throw Error(error.message);
    }
  }

  async getCurrentUser() {
    try {
      const user = await pocketbase
        .collection("users")
        .authRefresh({ expand: "role,department" });
      if (!user) return undefined;

      return {
        names: user.record?.name,
        email: user.record?.email,
        id: user.record?.id,
        photo: user.record?.avatar,
        phone: user.record?.phone,
        created_at: user.record?.created_at,
        status: user.record?.status,
        role: user.record?.expand?.role,
      };
    } catch (error) {
      throw Error(error.message);
    }
  }

  async updateProfile(profile: any) {
    console.log(profile);
    // const { data, error } = await supabase.auth.updateUser({ ...profile });
    // if (error) return error;
    // return data;
  }

  async changePassword({ newPassword }) {
    console.log(newPassword);
    // const { data, error } = await supabase.auth.updateUser({
    //   password: newPassword,
    // });
    // if (error) return error;
    // return data;
  }

  async forgotPassword({ email }) {
    console.log(email);
    // const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: "http://example.com/auth/reset-password",
    // });
    // if (error) return error;
    // return data;
  }

  async logout() {
    try {
      await await pocketbase.authStore.clear();
    } catch (error) {
      throw Error(error.message);
    }
  }
}

const authService = new AuthService();

export default authService;
