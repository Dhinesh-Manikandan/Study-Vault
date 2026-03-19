package com.studyvault.security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.ECParameterSpec;
import java.security.interfaces.ECPublicKey;
import java.util.Base64;

/**
 * Supabase now uses ES256 (Elliptic Curve) JWTs instead of HS256.
 * We verify using the public key from the JWKS endpoint.
 * Public key coordinates are hardcoded from your Supabase JWKS.
 */
@Component
public class JwtUtil {

    // P-256 curve coordinates from your Supabase JWKS:
    // x = KsoE-c6NalfG56mUWB5M4iRNXi6kTYh9bSCRoOx-ms0
    // y = L-t7pMkSFAYVe6rqbQrpyRz1yQVtFnfdZI1bMx0ahlg
    private static final String EC_X = "KsoE-c6NalfG56mUWB5M4iRNXi6kTYh9bSCRoOx-ms0";
    private static final String EC_Y = "L-t7pMkSFAYVe6rqbQrpyRz1yQVtFnfdZI1bMx0ahlg";

    private PublicKey publicKey;

    private PublicKey getPublicKey() {
        if (publicKey != null) return publicKey;
        try {
            Base64.Decoder dec = Base64.getUrlDecoder();
            byte[] xBytes = dec.decode(EC_X);
            byte[] yBytes = dec.decode(EC_Y);

            BigInteger x = new BigInteger(1, xBytes);
            BigInteger y = new BigInteger(1, yBytes);

            KeyFactory kf = KeyFactory.getInstance("EC");
            // Use P-256 (secp256r1) parameters
            java.security.AlgorithmParameters params =
                java.security.AlgorithmParameters.getInstance("EC");
            params.init(new java.security.spec.ECGenParameterSpec("secp256r1"));
            ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

            ECPoint point = new ECPoint(x, y);
            ECPublicKeySpec spec = new ECPublicKeySpec(point, ecSpec);
            publicKey = kf.generatePublic(spec);
            return publicKey;
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Supabase EC public key", e);
        }
    }

    public String extractUserId(String token) {
        return Jwts.parser()
            .verifyWith((java.security.interfaces.ECPublicKey) getPublicKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser()
                .verifyWith((java.security.interfaces.ECPublicKey) getPublicKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
