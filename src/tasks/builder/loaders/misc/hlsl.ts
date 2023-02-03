/*
Language: HLSL
Description: High-level shader language
Author: Stef Levesque
Website: https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl
Category: graphics
https://github.com/highlightjs/highlightjs-hlsl/blob/master/src/languages/hlsl.js
*/

const HLSL_NUMBER_RE =
    '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?([hHfFlL]?)|\\.\\d+)([eE][-+]?\\d+)?([hHfFlL]?))'; // 0x..., 0..., decimal, float, half, double

const HLSL_NUMBER_MODE = {
    className: 'number',
    begin: HLSL_NUMBER_RE,
    relevance: 0
};

export default function (hljs) {
    // added for historic reasons because `hljs.C_LINE_COMMENT_MODE` does
    // not include such support nor can we be sure all the grammars depending
    // on it would desire this behavior
    const C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$', {
        contains: [
            {
                begin: /\\\n/
            }
        ]
    });
    // https://en.cppreference.com/w/cpp/language/escape
    // \\ \x \xFF \u2837 \u00323747 \374
    const CHARACTER_ESCAPES =
        '\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)';
    const STRINGS = {
        className: 'string',
        variants: [
            {
                begin: '(u8?|U|L)?"',
                end: '"',
                illegal: '\\n',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + '|.)',
                end: "'",
                illegal: '.'
            },
            hljs.END_SAME_AS_BEGIN({
                begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
                end: /\)([^()\\ ]{0,16})"/
            })
        ]
    };
    const PREPROCESSOR = {
        className: 'meta',
        begin: /#\s*[a-z]+\b/,
        end: /$/,
        keywords: {
            keyword:
                'if else elif endif define undef warning error line ' +
                'pragma _Pragma ifdef ifndef include'
        },
        contains: [
            {
                begin: /\\\n/,
                relevance: 0
            },
            hljs.inherit(STRINGS, {
                className: 'string'
            }),
            {
                className: 'string',
                begin: /<.*?>/
            },
            C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
        ]
    };

    let matrixBases =
        'bool double float half int uint ' +
        'min16float min10float min16int min12int min16uint';

    let matrixSuffixes = [
        '',
        '1',
        '2',
        '3',
        '4',
        '1x1',
        '1x2',
        '1x3',
        '1x4',
        '2x1',
        '2x2',
        '2x3',
        '2x4',
        '3x1',
        '3x2',
        '3x3',
        '3x4',
        '4x1',
        '4x2',
        '4x3',
        '4x4'
    ];

    let matrixTypes = [];

    for (let base of matrixBases.split(' ')) {
        for (let suffix of matrixSuffixes) {
            matrixTypes.push(base + suffix);
        }
    }

    let semanticsSV =
        'SV_Coverage SV_Depth SV_DispatchThreadID SV_DomainLocation ' +
        'SV_GroupID SV_GroupIndex SV_GroupThreadID SV_GSInstanceID SV_InnerCoverage SV_InsideTessFactor ' +
        'SV_InstanceID SV_IsFrontFace SV_OutputControlPointID SV_Position SV_PrimitiveID ' +
        'SV_RenderTargetArrayIndex SV_SampleIndex SV_StencilRef SV_TessFactor SV_VertexID ' +
        'SV_ViewportArrayIndex, SV_ShadingRate';

    let semanticsNum =
        'BINORMAL BLENDINDICES BLENDWEIGHT COLOR NORMAL POSITION PSIZE TANGENT TEXCOORD TESSFACTOR DEPTH ' +
        'SV_ClipDistance SV_CullDistance SV_DepthGreaterEqual SV_DepthLessEqual SV_Target ' +
        'SV_CLIPDISTANCE SV_CULLDISTANCE SV_DEPTHGREATEREQUAL SV_DEPTHLESSEQUAL SV_TARGET';

    let semanticsTypes = semanticsNum.split(' ');

    for (let s of semanticsNum.split(' ')) {
        for (let n of Array(16).keys()) {
            semanticsTypes.push(s + n.toString());
        }
    }

    return {
        name: 'HLSL',
        keywords: {
            keyword:
                'AppendStructuredBuffer asm asm_fragment BlendState break Buffer ByteAddressBuffer case ' +
                'cbuffer centroid class column_major compile compile_fragment CompileShader const continue ' +
                'ComputeShader ConsumeStructuredBuffer default DepthStencilState DepthStencilView discard do ' +
                'DomainShader dword else export extern false for fxgroup GeometryShader groupshared numthreads ' +
                'Hullshader if in inline inout InputPatch interface line lineadj linear LineStream ' +
                'matrix namespace nointerpolation noperspective ' +
                'NULL out OutputPatch packoffset pass pixelfragment PixelShader point PointStream precise ' +
                'RasterizerState RenderTargetView return register row_major RWBuffer RWByteAddressBuffer ' +
                'RWStructuredBuffer RWTexture1D RWTexture1DArray RWTexture2D RWTexture2DArray RWTexture3D sample ' +
                'sampler SamplerState SamplerComparisonState shared snorm stateblock stateblock_state static string ' +
                'struct switch StructuredBuffer ConstantBuffer tbuffer technique technique10 technique11 texture Texture1D ' +
                'Texture1DArray Texture2D Texture2DArray Texture2DMS Texture2DMSArray Texture3D TextureCube ' +
                'TextureCubeArray true typedef triangle triangleadj TriangleStream uint uniform unorm unsigned ' +
                'vector vertexfragment VertexShader void volatile while RaytracingAccelerationStructure RayDesc',

            type:
                // Data Types
                matrixTypes.join(' ') +
                ' ' +
                'Buffer vector matrix sampler SamplerState PixelShader VertexShader ' +
                'texture Texture1D Texture1DArray Texture2D Texture2DArray Texture2DMS Texture2DMSArray Texture3D ' +
                'TextureCube TextureCubeArray struct typedef',

            built_in:
                // Semantics
                'POSITIONT FOG PSIZE VFACE VPOS ' +
                semanticsTypes.join(' ') +
                ' ' +
                semanticsSV +
                ' ' +
                semanticsSV.toUpperCase() +
                ' ' +
                // Functions
                'abort abs acos all AllMemoryBarrier AllMemoryBarrierWithGroupSync any asdouble asfloat asin asint asuint ' +
                'atan atan2 ceil CheckAccessFullyMapped clamp clip cos cosh countbits cross D3DCOLORtoUBYTE4 ddx ddx_coarse ' +
                'ddx_fine ddy ddy_coarse ddy_fine degrees determinant DeviceMemoryBarrier DeviceMemoryBarrierWithGroupSync ' +
                'distance dot dst errorf EvaluateAttributeAtCentroid EvaluateAttributeAtSample EvaluateAttributeSnapped ' +
                'exp exp2 f16tof32 f32tof16 faceforward firstbithigh firstbitlow floor fma fmod frac frexp fwidth ' +
                'GetRenderTargetSampleCount GetRenderTargetSamplePosition GroupMemoryBarrier GroupMemoryBarrierWithGroupSync ' +
                'InterlockedAdd InterlockedAnd InterlockedCompareExchange InterlockedCompareStore InterlockedExchange ' +
                'InterlockedMax InterlockedMin InterlockedOr InterlockedXor isfinite isinf isnan ldexp length lerp lit log ' +
                'log10 log2 mad max min modf msad4 mul noise normalize pow printf Process2DQuadTessFactorsAvg ' +
                'Process2DQuadTessFactorsMax Process2DQuadTessFactorsMin ProcessIsolineTessFactors ProcessQuadTessFactorsAvg ' +
                'ProcessQuadTessFactorsMax ProcessQuadTessFactorsMin ProcessTriTessFactorsAvg ProcessTriTessFactorsMax ' +
                'ProcessTriTessFactorsMin radians rcp reflect refract reversebits round rsqrt saturate sign sin sincos sinh ' +
                'smoothstep sqrt step tan tanh tex1D tex1Dbias tex1Dgrad tex1Dlod tex1Dproj tex2D tex2Dbias tex2Dgrad ' +
                'tex2Dlod tex2Dproj tex3D tex3Dbias tex3Dgrad tex3Dlod tex3Dproj texCUBE texCUBEbias texCUBEgrad texCUBElod ' +
                'texCUBEproj transpose trunc TraceRay',

            literal: 'true false'
        },
        illegal: '"',
        contains: [
            C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            HLSL_NUMBER_MODE,
            PREPROCESSOR,
            {
                match: [
                    // extra complexity to deal with `enum class` and `enum struct`
                    /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
                    /\s+/,
                    /\w+/
                ],
                className: {
                    1: 'keyword',
                    3: 'title.class'
                }
            }
        ]
    };
}
