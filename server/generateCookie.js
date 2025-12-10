function generateCookie(res, jwtRefreshToken, jwtAccessToken){
    res.cookie("refreshToken", jwtRefreshToken, { 
      httpOnly: true,
      secure: false, // convert to true when use https
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie("accessToken", jwtAccessToken, { 
      httpOnly: true,
      secure: false, // convert to true when use https
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

module.exports = generateCookie;