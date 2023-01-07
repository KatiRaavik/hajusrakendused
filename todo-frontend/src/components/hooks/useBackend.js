import useLocalStorage from "use-local-storage";

export default function useBackend() {
    // const accessToken = "eUmOZ8wEQjR8f2Bxtx_ERsarMT28M_99"
    const [accessToken] = useLocalStorage("accessToken", "")
    const backendUrl = "http://demo2.z-bit.ee"

    const sendRequest = (url, method, body) => {
        var myHeaders = new Headers();
        if (accessToken !== "")
            myHeaders.append("Authorization", "Bearer "+accessToken);
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Content-Type", "application/json");

        var requestOptions = {
            method: method,
            headers: myHeaders,
            redirect: 'follow',
            // credentials: 'include'
        };

        // dont add body in methods not included in noBodyMethods array
        const noBodyMethods = ["GET", "DELETE", "HEAD", "OPTIONS"]
        if (!noBodyMethods.includes(method.toUpperCase())) {
            requestOptions.body = JSON.stringify(body)
        }

        return fetch(backendUrl + url, requestOptions)
            .then(response => response.json())
            .catch(error => console.log('error', error));
    }

    return {
        sendRequest
    }
}

