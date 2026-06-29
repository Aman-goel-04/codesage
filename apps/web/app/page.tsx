"use client";

export default function Home() {
    return (
        <button
            onClick={async () => {
                const res = await fetch(
                    "http://localhost:3001/repos/connect",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            repoUrl:
                                "https://github.com/js-org/js.org",
                        }),
                    },
                );

                console.log(await res.text());
            }}
        >
            Connect Github
        </button>
    );
}