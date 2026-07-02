export function toPublicUser(user) {
    const { password: _password, ...publicUser } = user;
    return publicUser;
}
