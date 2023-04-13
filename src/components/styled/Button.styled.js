import styled from 'styled-components';
import AsketNarrowOtf from "../../resources/fonts/AsketNarrowLight.otf";
import AsketNarrowEot from "../../resources/fonts/AsketNarrowLight.eot";
import AsketNarrowSvg from "../../resources/fonts/AsketNarrowLight.svg";
import AsketNarrowTtf from "../../resources/fonts/AsketNarrowLight.ttf";
import AsketNarrowWoff from "../../resources/fonts/AsketNarrowLight.woff";

export const Button = styled.button`
    @font-face {
        font-family: 'Asket Narrow';
        src: url(${AsketNarrowOtf}) format('otf'),
             url(${AsketNarrowEot}) format('embedded-opentype'),
             url(${AsketNarrowWoff}) format('woff'),
             url(${AsketNarrowTtf}) format('truetype'),
             url(${AsketNarrowSvg}) format('svg');
    }

    font-family: 'Asket Narrow';
    background: transparent;
    border: transparent;
    font-size: 30pt;
    width: 100%;
    
    cursor: pointer;
    
    :hover {
        color: ${'#' + (0x1000000+Math.random() * 0xffffff).toString(16).slice(1, 7)}
    }

    :active {
        color: ${'#' + (0x1000000+Math.random() * 0xffffff).toString(16).slice(1, 7)}
    }
`